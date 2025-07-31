// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID 等信息
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 获取请求参数
  const { gameId, score, playTime } = event
  
  // 验证参数
  if (!gameId || !score || isNaN(score)) {
    return {
      success: false,
      error: '参数无效'
    }
  }
  
  try {
    // 查询用户数据
    const userQuery = await db.collection('users').where({
      _openid: openid
    }).get()
    
    if (userQuery.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }
    
    const user = userQuery.data[0]
    const userId = user._id
    
    // 获取游戏配置
    const configQuery = await db.collection('gameConfig').where({
      type: 'games'
    }).get()
    
    let gameConfig = null
    let allGames = []
    
    if (configQuery.data.length > 0) {
      allGames = configQuery.data[0].games || []
      gameConfig = allGames.find(game => game.id === gameId)
    }
    
    if (!gameConfig) {
      // 使用默认游戏配置
      allGames = [
        {
          id: 'game1',
          name: '弹球游戏',
          unlockPoints: 0,
          pointsPerPlay: 5,
          pointsPerWin: 20
        },
        {
          id: 'game2',
          name: '记忆配对',
          unlockPoints: 100,
          pointsPerPlay: 5,
          pointsPerWin: 20
        },
        {
          id: 'game3',
          name: '飞机大战',
          unlockPoints: 300,
          pointsPerPlay: 5,
          pointsPerWin: 20
        }
      ]
      gameConfig = allGames.find(game => game.id === gameId)
    }
    
    if (!gameConfig) {
      return {
        success: false,
        error: '游戏配置不存在'
      }
    }
    
    // 计算获得的积分
    let earnedPoints = gameConfig.pointsPerPlay || 5
    
    // 根据分数计算额外积分
    if (score > 0) {
      // 将游戏分数转换为积分奖励，可以根据游戏类型设置不同的转换规则
      const scoreMultiplier = 0.1 // 10分游戏分数 = 1积分
      earnedPoints += Math.floor(score * scoreMultiplier)
    }
    
    // 更新用户游戏记录
    const now = new Date()
    const gameRecords = user.gameRecords || {}
    const gameRecord = gameRecords[gameId] || {
      highScore: 0,
      totalScore: 0,
      playCount: 0,
      winCount: 0,
      totalPlayTime: 0,
      lastPlayed: null
    }
    
    // 更新游戏记录
    gameRecord.totalScore += score
    gameRecord.playCount += 1
    gameRecord.lastPlayed = now
    
    if (playTime) {
      gameRecord.totalPlayTime += playTime
    }
    
    // 更新最高分
    if (score > gameRecord.highScore) {
      gameRecord.highScore = score
    }
    
    // 判断是否获胜（根据游戏类型可能有不同的判断标准）
    let isWin = false
    if (gameId === 'game1' && score >= 500) {
      isWin = true
      gameRecord.winCount += 1
      earnedPoints += gameConfig.pointsPerWin || 20
    } else if (gameId === 'game2') {
      // 记忆配对游戏的获胜条件可能是完成所有配对
      if (event.completed) {
        isWin = true
        gameRecord.winCount += 1
        earnedPoints += gameConfig.pointsPerWin || 20
      }
    } else if (gameId === 'game3' && score >= 5000) {
      isWin = true
      gameRecord.winCount += 1
      earnedPoints += gameConfig.pointsPerWin || 20
    }
    
    // 更新游戏记录
    gameRecords[gameId] = gameRecord
    
    // 更新用户积分和游戏记录
    const updateResult = await db.collection('users').doc(userId).update({
      data: {
        points: _.inc(earnedPoints),
        gameRecords: gameRecords
      }
    })
    
    // 获取更新后的用户数据
    const updatedUser = await db.collection('users').doc(userId).get()
    const updatedPoints = updatedUser.data.points
    
    // 检查是否解锁新游戏
    const unlockedGames = updatedUser.data.unlockedGames || ['game1']
    const newUnlocked = []
    
    allGames.forEach(game => {
      if (!unlockedGames.includes(game.id) && updatedPoints >= game.unlockPoints) {
        newUnlocked.push(game.id)
      }
    })
    
    // 如果有新解锁的游戏，更新用户数据
    if (newUnlocked.length > 0) {
      const allUnlocked = [...unlockedGames, ...newUnlocked]
      await db.collection('users').doc(userId).update({
        data: {
          unlockedGames: allUnlocked
        }
      })
    }
    
    return {
      success: true,
      points: updatedPoints,
      earnedPoints: earnedPoints,
      gameRecord: gameRecord,
      isWin: isWin,
      newUnlocked: newUnlocked,
      unlockedGames: newUnlocked.length > 0 ? [...unlockedGames, ...newUnlocked] : unlockedGames
    }
  } catch (error) {
    console.error('更新分数失败', error)
    return {
      success: false,
      error: error
    }
  }
}