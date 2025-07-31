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
  const { points, type, description } = event
  
  if (points === undefined) {
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
    const now = new Date()
    
    // 更新用户积分
    await db.collection('users').doc(user._id).update({
      data: {
        points: _.inc(points),
        updatedAt: now
      }
    })
    
    // 添加积分记录
    await db.collection('point_records').add({
      data: {
        openid: openid,
        points: points,
        type: type || 'other',
        description: description || '积分变更',
        createdAt: now
      }
    })
    
    // 获取更新后的用户信息
    const updatedUserResult = await db.collection('users').doc(user._id).get()
    const updatedUser = updatedUserResult.data
    
    // 检查积分成就
    await checkPointsAchievement(openid, updatedUser.points)
    
    return {
      success: true,
      message: '积分更新成功',
      currentPoints: updatedUser.points
    }
    
  } catch (error) {
    console.error('更新积分失败', error)
    return {
      success: false,
      message: '更新积分失败',
      error: error
    }
  }
}

// 检查积分成就
async function checkPointsAchievement(openid, currentPoints) {
  try {
    // 检查是否达到成就条件（例如：累计积分达到100、500、1000）
    const achievements = [
      { id: 'achievement1', points: 100 },
      { id: 'achievement2', points: 500 },
      { id: 'achievement3', points: 1000 }
    ]
    
    for (const achievement of achievements) {
      if (currentPoints >= achievement.points) {
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
    console.error('检查积分成就失败', error)
    return false
  }
}