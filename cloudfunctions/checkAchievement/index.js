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
  const { achievementId } = event
  
  if (!achievementId) {
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
    
    // 检查成就是否存在
    const achievementResult = await db.collection('achievements').where({
      id: achievementId
    }).get()
    
    if (achievementResult.data.length === 0) {
      return {
        success: false,
        message: '成就不存在'
      }
    }
    
    const achievement = achievementResult.data[0]
    
    // 检查用户是否已获得该成就
    const userAchievementResult = await db.collection('user_achievements').where({
      openid: openid,
      achievementId: achievementId
    }).get()
    
    // 如果已获得该成就，返回已获得信息
    if (userAchievementResult.data.length > 0) {
      return {
        success: true,
        message: '已获得该成就',
        alreadyUnlocked: true,
        achievement: achievement
      }
    }
    
    const now = new Date()
    
    // 添加用户成就记录
    await db.collection('user_achievements').add({
      data: {
        openid: openid,
        achievementId: achievementId,
        unlockedAt: now,
        createdAt: now
      }
    })
    
    // 奖励积分
    await db.collection('users').where({
      openid: openid
    }).update({
      data: {
        points: _.inc(achievement.points)
      }
    })
    
    // 添加积分记录
    await db.collection('point_records').add({
      data: {
        openid: openid,
        points: achievement.points,
        type: 'achievement',
        description: `解锁成就：${achievement.name}`,
        createdAt: now
      }
    })
    
    return {
      success: true,
      message: '成就解锁成功',
      alreadyUnlocked: false,
      achievement: achievement,
      pointsRewarded: achievement.points
    }
    
  } catch (error) {
    console.error('检查成就失败', error)
    return {
      success: false,
      message: '检查成就失败',
      error: error
    }
  }
}