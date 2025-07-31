// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID 等信息
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 获取请求参数
  const { gameId, type = 'score', limit = 10 } = event
  
  // 验证参数
  if (!gameId) {
    return {
      success: false,
      error: '参数无效'
    }
  }
  
  try {
    let rankingData = []
    let userRank = -1
    
    // 根据排行榜类型获取数据
    if (type === 'score') {
      // 获取分数排行榜
      const rankingQuery = await db.collection('users')
        .aggregate()
        .match({
          [`gameRecords.${gameId}`]: _.exists(true)
        })
        .sort({
          [`gameRecords.${gameId}.highScore`]: -1
        })
        .limit(limit)
        .project({
          _id: 1,
          _openid: 1,
          nickName: 1,
          avatarUrl: 1,
          points: 1,
          [`gameRecords.${gameId}.highScore`]: 1
        })
        .end()
      
      rankingData = rankingQuery.list.map((user, index) => {
        const rank = index + 1
        if (user._openid === openid) {
          userRank = rank
        }
        
        return {
          rank: rank,
          userId: user._id,
          openid: user._openid,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          score: user.gameRecords[gameId].highScore,
          points: user.points
        }
      })
      
      // 如果用户不在前N名，查询用户的排名
      if (userRank === -1) {
        // 获取用户数据
        const userQuery = await db.collection('users').where({
          _openid: openid
        }).get()
        
        if (userQuery.data.length > 0) {
          const user = userQuery.data[0]
          
          // 如果用户有该游戏的记录
          if (user.gameRecords && user.gameRecords[gameId]) {
            // 计算用户排名
            const higherScoreCount = await db.collection('users')
              .where({
                [`gameRecords.${gameId}.highScore`]: _.gt(user.gameRecords[gameId].highScore)
              })
              .count()
            
            userRank = higherScoreCount.total + 1
            
            // 添加用户数据到排行榜末尾
            rankingData.push({
              rank: userRank,
              userId: user._id,
              openid: user._openid,
              nickName: user.nickName,
              avatarUrl: user.avatarUrl,
              score: user.gameRecords[gameId].highScore,
              points: user.points,
              isCurrentUser: true
            })
          }
        }
      }
    } else if (type === 'wins') {
      // 获取胜利次数排行榜
      const rankingQuery = await db.collection('users')
        .aggregate()
        .match({
          [`gameRecords.${gameId}`]: _.exists(true)
        })
        .sort({
          [`gameRecords.${gameId}.winCount`]: -1
        })
        .limit(limit)
        .project({
          _id: 1,
          _openid: 1,
          nickName: 1,
          avatarUrl: 1,
          points: 1,
          [`gameRecords.${gameId}.winCount`]: 1
        })
        .end()
      
      rankingData = rankingQuery.list.map((user, index) => {
        const rank = index + 1
        if (user._openid === openid) {
          userRank = rank
        }
        
        return {
          rank: rank,
          userId: user._id,
          openid: user._openid,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          wins: user.gameRecords[gameId].winCount,
          points: user.points
        }
      })
      
      // 如果用户不在前N名，查询用户的排名
      if (userRank === -1) {
        // 获取用户数据
        const userQuery = await db.collection('users').where({
          _openid: openid
        }).get()
        
        if (userQuery.data.length > 0) {
          const user = userQuery.data[0]
          
          // 如果用户有该游戏的记录
          if (user.gameRecords && user.gameRecords[gameId]) {
            // 计算用户排名
            const higherWinsCount = await db.collection('users')
              .where({
                [`gameRecords.${gameId}.winCount`]: _.gt(user.gameRecords[gameId].winCount)
              })
              .count()
            
            userRank = higherWinsCount.total + 1
            
            // 添加用户数据到排行榜末尾
            rankingData.push({
              rank: userRank,
              userId: user._id,
              openid: user._openid,
              nickName: user.nickName,
              avatarUrl: user.avatarUrl,
              wins: user.gameRecords[gameId].winCount,
              points: user.points,
              isCurrentUser: true
            })
          }
        }
      }
    } else if (type === 'points') {
      // 获取积分排行榜
      const rankingQuery = await db.collection('users')
        .aggregate()
        .sort({
          points: -1
        })
        .limit(limit)
        .project({
          _id: 1,
          _openid: 1,
          nickName: 1,
          avatarUrl: 1,
          points: 1
        })
        .end()
      
      rankingData = rankingQuery.list.map((user, index) => {
        const rank = index + 1
        if (user._openid === openid) {
          userRank = rank
        }
        
        return {
          rank: rank,
          userId: user._id,
          openid: user._openid,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          points: user.points
        }
      })
      
      // 如果用户不在前N名，查询用户的排名
      if (userRank === -1) {
        // 获取用户数据
        const userQuery = await db.collection('users').where({
          _openid: openid
        }).get()
        
        if (userQuery.data.length > 0) {
          const user = userQuery.data[0]
          
          // 计算用户排名
          const higherPointsCount = await db.collection('users')
            .where({
              points: _.gt(user.points)
            })
            .count()
          
          userRank = higherPointsCount.total + 1
          
          // 添加用户数据到排行榜末尾
          rankingData.push({
            rank: userRank,
            userId: user._id,
            openid: user._openid,
            nickName: user.nickName,
            avatarUrl: user.avatarUrl,
            points: user.points,
            isCurrentUser: true
          })
        }
      }
    }
    
    return {
      success: true,
      ranking: rankingData,
      userRank: userRank,
      gameId: gameId,
      type: type
    }
  } catch (error) {
    console.error('获取排行榜失败', error)
    return {
      success: false,
      error: error
    }
  }
}