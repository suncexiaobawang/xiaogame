// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 获取参数
  const { gameId, score } = event
  
  if (!gameId || score === undefined) {
    return {
      success: false,
      message: '参数错误'
    }
  }
  
  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    // 获取用户游戏记录
    const gameRecordResult = await db.collection('game_records').where({
      openid: openid,
      gameId: gameId
    }).get()
    
    const now = new Date()
    
    // 如果没有游戏记录，创建新记录
    if (gameRecordResult.data.length === 0) {
      await db.collection('game_records').add({
        data: {
          openid: openid,
          gameId: gameId,
          highScore: score,
          playCount: 1,
          lastPlayTime: now,
          createdAt: now,
          updatedAt: now
        }
      })
      
      // 检查游戏次数成就
      await checkPlayCountAchievement(openid)
      
      return {
        success: true,
        message: '记录创建成功',
        isNewHighScore: true,
        highScore: score
      }
    }
    
    // 更新现有记录
    const gameRecord = gameRecordResult.data[0]
    const isNewHighScore = score > gameRecord.highScore
    
    const updateData = {
      playCount: _.inc(1),
      lastPlayTime: now,
      updatedAt: now
    }
    
    // 如果是新的高分，更新高分
    if (isNewHighScore) {
      updateData.highScore = score
    }
    
    await db.collection('game_records').doc(gameRecord._id).update({
      data: updateData
    })
    
    // 检查游戏次数成就
    await checkPlayCountAchievement(openid)
    
    return {
      success: true,
      message: '记录更新成功',
      isNewHighScore: isNewHighScore,
      highScore: isNewHighScore ? score : gameRecord.highScore
    }
    
  } catch (error) {
    console.error('更新游戏记录失败', error)
    return {
      success: false,
      message: '更新游戏记录失败',
      error: error
    }
  }
}

// 检查游戏次数成就
async function checkPlayCountAchievement(openid) {
  try {
    // 获取用户总游戏次数
    const totalPlayCountResult = await db.collection('game_records')
      .where({ openid: openid })
      .count()
    
    const totalPlayCount = totalPlayCountResult.total
    
    // 检查是否达到成就条件（例如：玩游戏10次、50次、100次）
    const achievements = [
      { id: 'achievement5', count: 10 },
      { id: 'achievement6', count: 50 },
      { id: 'achievement7', count: 100 }
    ]
    
    for (const achievement of achievements) {
      if (totalPlayCount >= achievement.count) {
        // 检查用户是否已获得该成就
        const userAchievementResult = await db.collection('user_achievements').where({
          openid: openid,
          achievementId: achievement.id
        }).get()
        
        // 如果未获得该成就，添加成就并奖励积分
        if (userAchievementResult.data.length === 0) {
          // 获取成就信息
          const achievementResult = await db.collection('achievements').where({
            id: achievement.id
          }).get()
          
          if (achievementResult.data.length > 0) {
            const achievementInfo = achievementResult.data[0]
            const now = new Date()
            
            // 添加用户成就记录
            await db.collection('user_achievements').add({
              data: {
                openid: openid,
                achievementId: achievement.id,
                unlockedAt: now,
                createdAt: now
              }
            })
            
            // 奖励积分
            await db.collection('users').where({
              openid: openid
            }).update({
              data: {
                points: _.inc(achievementInfo.points)
              }
            })
            
            // 添加积分记录
            await db.collection('point_records').add({
              data: {
                openid: openid,
                points: achievementInfo.points,
                type: 'achievement',
                description: `解锁成就：${achievementInfo.name}`,
                createdAt: now
              }
            })
          }
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('检查游戏次数成就失败', error)
    return false
  }
}