// 游戏工具类

// 云开发初始化
const initCloud = () => {
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    return false
  }
  
  wx.cloud.init({
    env: wx.cloud.DYNAMIC_CURRENT_ENV,
    traceUser: true
  })
  
  return true
}

// 加载图片资源
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const image = wx.createImage()
    image.src = src
    image.onload = () => resolve(image)
    image.onerror = (e) => reject(e)
  })
}

// 加载多个图片资源
const loadImages = (sources) => {
  const promises = Object.keys(sources).map(key => {
    return loadImage(sources[key]).then(image => ({ key, image }))
  })
  
  return Promise.all(promises).then(images => {
    const result = {}
    images.forEach(item => {
      result[item.key] = item.image
    })
    return result
  })
}

// 加载音频资源
const loadAudio = (src) => {
  return new Promise((resolve) => {
    const audio = wx.createInnerAudioContext()
    audio.src = src
    audio.onCanplay(() => resolve(audio))
    audio.onError(() => {
      console.error(`音频加载失败: ${src}`)
      resolve(null)
    })
  })
}

// 播放音效
const playSound = (audio, loop = false) => {
  if (!audio) return
  
  try {
    audio.loop = loop
    audio.play()
  } catch (error) {
    console.error('播放音效失败', error)
  }
}

// 停止音效
const stopSound = (audio) => {
  if (!audio) return
  
  try {
    audio.stop()
  } catch (error) {
    console.error('停止音效失败', error)
  }
}

// 振动反馈
const vibrateShort = () => {
  try {
    wx.vibrateShort({
      success: () => {},
      fail: () => {}
    })
  } catch (error) {
    console.error('振动失败', error)
  }
}

// 振动长反馈
const vibrateLong = () => {
  try {
    wx.vibrateLong({
      success: () => {},
      fail: () => {}
    })
  } catch (error) {
    console.error('振动失败', error)
  }
}

// 显示加载提示
const showLoading = (title = '加载中') => {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载提示
const hideLoading = () => {
  wx.hideLoading()
}

// 显示提示
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  })
}

// 显示模态对话框
const showModal = (title, content, showCancel = true) => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      showCancel,
      success: (res) => resolve(res.confirm)
    })
  })
}

// 获取系统信息
const getSystemInfo = () => {
  return new Promise((resolve) => {
    wx.getSystemInfo({
      success: (res) => resolve(res),
      fail: () => resolve(null)
    })
  })
}

// 获取屏幕安全区域
const getSafeArea = async () => {
  const systemInfo = await getSystemInfo()
  return systemInfo ? (systemInfo.safeArea || null) : null
}

// 获取本地存储数据
const getStorage = (key) => {
  return new Promise((resolve) => {
    wx.getStorage({
      key,
      success: (res) => resolve(res.data),
      fail: () => resolve(null)
    })
  })
}

// 设置本地存储数据
const setStorage = (key, data) => {
  return new Promise((resolve) => {
    wx.setStorage({
      key,
      data,
      success: () => resolve(true),
      fail: () => resolve(false)
    })
  })
}

// 移除本地存储数据
const removeStorage = (key) => {
  return new Promise((resolve) => {
    wx.removeStorage({
      key,
      success: () => resolve(true),
      fail: () => resolve(false)
    })
  })
}

// 清除所有本地存储数据
const clearStorage = () => {
  return new Promise((resolve) => {
    wx.clearStorage({
      success: () => resolve(true),
      fail: () => resolve(false)
    })
  })
}

// 分享游戏
const shareGame = (title, imageUrl) => {
  return {
    title: title || '好玩的小游戏集合，快来挑战吧！',
    imageUrl: imageUrl || 'images/share_image.jpg',
    success: () => {
      showToast('分享成功')
    },
    fail: () => {
      showToast('分享失败')
    }
  }
}

// 登录
const login = () => {
  return new Promise((resolve, reject) => {
    showLoading('登录中')
    
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: (res) => {
        hideLoading()
        if (res.result && res.result.success) {
          resolve(res.result.data)
        } else {
          reject(new Error(res.result?.message || '登录失败'))
        }
      },
      fail: (err) => {
        hideLoading()
        reject(err)
      }
    })
  })
}

// 更新分数
const updateScore = (gameId, score, playTime) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'updateScore',
      data: { gameId, score, playTime },
      success: (res) => {
        if (res.result && res.result.success) {
          resolve(res.result.data)
        } else {
          reject(new Error(res.result?.message || '更新分数失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 获取排行榜
const getRanking = (gameId, type = 'score', timeRange = 'all', pageSize = 20, pageIndex = 0) => {
  return new Promise((resolve, reject) => {
    showLoading('加载排行榜')
    
    wx.cloud.callFunction({
      name: 'getRanking',
      data: { gameId, type, timeRange, pageSize, pageIndex },
      success: (res) => {
        hideLoading()
        if (res.result && res.result.success) {
          resolve(res.result.data)
        } else {
          reject(new Error(res.result?.message || '获取排行榜失败'))
        }
      },
      fail: (err) => {
        hideLoading()
        reject(err)
      }
    })
  })
}

// 显示好友排行榜
const showFriendRanking = (gameId, rankType = 'score', timeRange = 'all') => {
  // 获取开放数据域
  const openDataContext = wx.getOpenDataContext()
  const sharedCanvas = openDataContext.canvas
  
  // 发送消息给开放数据域
  openDataContext.postMessage({
    event: 'showRanking',
    gameId,
    rankType,
    timeRange
  })
  
  // 更新视口大小
  const { screenWidth, screenHeight } = wx.getSystemInfoSync()
  openDataContext.postMessage({
    event: 'updateViewPort',
    width: screenWidth,
    height: screenHeight
  })
  
  return sharedCanvas
}

// 关闭好友排行榜
const closeFriendRanking = () => {
  const openDataContext = wx.getOpenDataContext()
  openDataContext.postMessage({
    event: 'close'
  })
}

// 碰撞检测 - 矩形
const isCollision = (rect1, rect2) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

// 碰撞检测 - 圆形
const isCircleCollision = (circle1, circle2) => {
  const dx = circle1.x - circle2.x
  const dy = circle1.y - circle2.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  return distance < (circle1.radius + circle2.radius)
}

// 碰撞检测 - 点和矩形
const isPointInRect = (point, rect) => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

// 碰撞检测 - 点和圆形
const isPointInCircle = (point, circle) => {
  const dx = point.x - circle.x
  const dy = point.y - circle.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  return distance <= circle.radius
}

// 随机整数
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 随机浮点数
const randomFloat = (min, max) => {
  return Math.random() * (max - min) + min
}

// 随机颜色
const randomColor = () => {
  return `rgb(${randomInt(0, 255)}, ${randomInt(0, 255)}, ${randomInt(0, 255)})`
}

// 角度转弧度
const degToRad = (degrees) => {
  return degrees * Math.PI / 180
}

// 弧度转角度
const radToDeg = (radians) => {
  return radians * 180 / Math.PI
}

// 计算两点之间的距离
const distance = (point1, point2) => {
  const dx = point1.x - point2.x
  const dy = point1.y - point2.y
  return Math.sqrt(dx * dx + dy * dy)
}

// 计算两点之间的角度
const angleBetween = (point1, point2) => {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x)
}

// 线性插值
const lerp = (start, end, t) => {
  return start + (end - start) * t
}

// 限制值在范围内
const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value))
}

// 格式化时间（秒 -> MM:SS）
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 格式化分数
const formatScore = (score) => {
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 导出工具函数
module.exports = {
  initCloud,
  loadImage,
  loadImages,
  loadAudio,
  playSound,
  stopSound,
  vibrateShort,
  vibrateLong,
  showLoading,
  hideLoading,
  showToast,
  showModal,
  getSystemInfo,
  getSafeArea,
  getStorage,
  setStorage,
  removeStorage,
  clearStorage,
  shareGame,
  login,
  updateScore,
  getRanking,
  showFriendRanking,
  closeFriendRanking,
  isCollision,
  isCircleCollision,
  isPointInRect,
  isPointInCircle,
  randomInt,
  randomFloat,
  randomColor,
  degToRad,
  radToDeg,
  distance,
  angleBetween,
  lerp,
  clamp,
  formatTime,
  formatScore
}