// 云函数入口文件
const cloud = require('wx-server-sdk');
const config = require('./config.js');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const userCollection = db.collection('users');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  if (!openid) {
    return {
      code: -1,
      msg: '获取用户openid失败'
    };
  }
  
  try {
    // 查询用户是否存在
    const userResult = await userCollection.where({
      _openid: openid
    }).get();
    
    // 获取当前时间
    const now = new Date();
    const today = formatDate(now);
    
    // 如果用户不存在，创建新用户
    if (userResult.data.length === 0) {
      // 新用户数据
      const userData = {
        _openid: openid,
        nickName: event.userInfo ? event.userInfo.nickName : '游客' + openid.substring(0, 5),
        avatarUrl: event.userInfo ? event.userInfo.avatarUrl : '',
        points: config.pointsConfig.initialPoints,
        unlockedGames: ['game1'], // 默认解锁第一个游戏
        achievements: [],
        firstLogin: today,
        lastLogin: today,
        loginDays: 1,
        consecutiveLoginDays: 1,
        loginHistory: [today],
        gameHistory: [],
        purchasedItems: [],
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      };
      
      // 创建用户
      await userCollection.add({
        data: userData
      });
      
      return {
        code: 0,
        msg: '新用户创建成功',
        data: {
          ...userData,
          isNewUser: true,
          todayFirstLogin: true,
          loginReward: config.pointsConfig.dailyLoginReward
        }
      };
    }
    
    // 用户存在，更新登录信息
    const user = userResult.data[0];
    const lastLogin = user.lastLogin || '';
    const consecutiveLoginDays = user.consecutiveLoginDays || 0;
    
    // 检查是否是今天第一次登录
    const isTodayFirstLogin = lastLogin !== today;
    
    // 计算登录奖励
    let loginReward = 0;
    let newConsecutiveLoginDays = consecutiveLoginDays;
    
    if (isTodayFirstLogin) {
      // 基础每日登录奖励
      loginReward += config.pointsConfig.dailyLoginReward;
      
      // 检查是否是连续登录
      const yesterday = formatDate(new Date(now.setDate(now.getDate() - 1)));
      const isConsecutiveLogin = lastLogin === yesterday;
      
      if (isConsecutiveLogin) {
        // 连续登录天数增加
        newConsecutiveLoginDays = Math.min(consecutiveLoginDays + 1, config.pointsConfig.maxConsecutiveDays);
        
        // 连续登录额外奖励
        loginReward += config.pointsConfig.consecutiveLoginBonus;
      } else {
        // 不是连续登录，重置连续登录天数
        newConsecutiveLoginDays = 1;
      }
      
      // 更新用户数据
      const updateData = {
        lastLogin: today,
        loginDays: _.inc(1),
        consecutiveLoginDays: newConsecutiveLoginDays,
        points: _.inc(loginReward),
        updatedAt: db.serverDate()
      };
      
      // 如果是新的一天登录，添加到登录历史
      if (isTodayFirstLogin) {
        updateData.loginHistory = _.push([today]);
      }
      
      // 更新用户数据
      await userCollection.doc(user._id).update({
        data: updateData
      });
      
      // 检查是否达成连续登录成就
      if (newConsecutiveLoginDays >= 7) {
        // 查找日常玩家成就
        const dailyPlayerAchievement = config.achievements.find(a => a.id === 'achievement3');
        
        // 检查用户是否已经获得该成就
        const hasAchievement = user.achievements && user.achievements.includes('achievement3');
        
        if (dailyPlayerAchievement && !hasAchievement) {
          // 添加成就并奖励积分
          await userCollection.doc(user._id).update({
            data: {
              achievements: _.push(['achievement3']),
              points: _.inc(dailyPlayerAchievement.points)
            }
          });
        }
      }
    }
    
    // 获取更新后的用户数据
    const updatedUserResult = await userCollection.doc(user._id).get();
    const updatedUser = updatedUserResult.data;
    
    return {
      code: 0,
      msg: '登录成功',
      data: {
        ...updatedUser,
        isNewUser: false,
        todayFirstLogin: isTodayFirstLogin,
        loginReward: isTodayFirstLogin ? loginReward : 0
      }
    };
    
  } catch (error) {
    console.error('登录失败', error);
    return {
      code: -1,
      msg: '登录失败: ' + error.message
    };
  }
};

// 格式化日期为 YYYY-MM-DD 格式
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}