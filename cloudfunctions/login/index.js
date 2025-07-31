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
  
  try {
    // 查询用户是否已存在
    const userQuery = await db.collection('users').where({
      _openid: openid
    }).get()
    
    // 获取当前时间
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    
    // 如果用户已存在
    if (userQuery.data.length > 0) {
      const user = userQuery.data[0]
      
      // 检查是否需要更新每日登录奖励
      let updateData = {}
      let dailyLoginBonus = 0
      
      // 如果今天还没有登录奖励
      if (!user.lastLoginDate || new Date(user.lastLoginDate).getTime() < today) {
        // 基础每日登录奖励
        dailyLoginBonus = 10
        
        // 检查连续登录
        let consecutiveDays = 1
        let consecutiveBonus = 0
        
        if (user.lastLoginDate) {
          const lastLogin = new Date(user.lastLoginDate)
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          
          // 如果上次登录是昨天，增加连续登录天数
          if (lastLogin.getTime() >= yesterday.getTime()) {
            consecutiveDays = (user.consecutiveLoginDays || 0) + 1
            // 最多计算7天连续登录
            if (consecutiveDays <= 7) {
              consecutiveBonus = consecutiveDays * 5 // 每天连续登录奖励5分
            } else {
              consecutiveBonus = 7 * 5 // 最多7天连续登录奖励
            }
          } else {
            // 连续登录中断
            consecutiveDays = 1
          }
        }
        
        // 更新用户数据
        updateData = {
          points: _.inc(dailyLoginBonus + consecutiveBonus),
          lastLoginDate: now,
          consecutiveLoginDays: consecutiveDays,
          lastLoginBonus: dailyLoginBonus + consecutiveBonus
        }
        
        // 更新数据库
        await db.collection('users').doc(user._id).update({
          data: updateData
        })
        
        // 获取更新后的用户数据
        const updatedUser = await db.collection('users').doc(user._id).get()
        
        return {
          success: true,
          data: updatedUser.data,
          dailyLoginBonus: dailyLoginBonus,
          consecutiveBonus: consecutiveBonus
        }
      }
      
      // 如果今天已经获得了登录奖励，直接返回用户数据
      return {
        success: true,
        data: user,
        dailyLoginBonus: 0,
        consecutiveBonus: 0
      }
    } else {
      // 用户不存在，创建新用户
      const result = await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: '游客' + openid.substring(openid.length - 4),
          avatarUrl: '',
          points: 10, // 初始积分
          unlockedGames: ['game1'], // 默认解锁第一个游戏
          gameRecords: {}, // 游戏记录
          achievements: [], // 成就
          items: [], // 已购买物品
          createdAt: now,
          lastLoginDate: now,
          consecutiveLoginDays: 1,
          lastLoginBonus: 10
        }
      })
      
      // 获取新创建的用户数据
      const newUser = await db.collection('users').doc(result._id).get()
      
      return {
        success: true,
        data: newUser.data,
        dailyLoginBonus: 10,
        consecutiveBonus: 0,
        isNewUser: true
      }
    }
  } catch (error) {
    console.error('登录失败', error)
    return {
      success: false,
      error: error
    }
  }
}