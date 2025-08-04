// 开放数据域入口文件
const sharedCanvas = wx.getSharedCanvas()
const context = sharedCanvas.getContext('2d')
let canvasWidth = 0
let canvasHeight = 0

// 资源加载器
class ResourceLoader {
  constructor() {
    this.resources = {}
    this.loadingCount = 0
    this.loadedCount = 0
  }

  // 加载图片资源
  loadImage(key, src) {
    if (this.resources[key]) {
      return Promise.resolve(this.resources[key])
    }

    this.loadingCount++
    return new Promise((resolve, reject) => {
      const image = wx.createImage()
      image.src = src
      image.onload = () => {
        this.resources[key] = image
        this.loadedCount++
        resolve(image)
      }
      image.onerror = (e) => {
        console.error(`加载图片失败: ${src}`, e)
        this.loadedCount++
        reject(e)
      }
    })
  }

  // 获取已加载的资源
  get(key) {
    return this.resources[key]
  }

  // 是否全部加载完成
  isLoaded() {
    return this.loadingCount === this.loadedCount
  }

  // 加载进度
  getProgress() {
    if (this.loadingCount === 0) return 1
    return this.loadedCount / this.loadingCount
  }
}

// 排行榜渲染器
class RankingRenderer {
  constructor() {
    this.resourceLoader = new ResourceLoader()
    this.rankingData = []
    this.selfData = null
    this.currentPage = 0
    this.pageSize = 5
    this.totalPages = 0
    this.gameId = ''
    this.rankType = 'score' // score 或 time
    this.timeRange = 'all' // all, day, week, month
    
    // 初始化资源
    this.initResources()
    
    // 监听主域消息
    this.initMessageListener()
    
    // 初始化画布尺寸
    this.initCanvas()
  }
  
  // 初始化资源
  async initResources() {
    try {
      await Promise.all([
        this.resourceLoader.loadImage('defaultAvatar', 'images/default_avatar.png'),
        this.resourceLoader.loadImage('rankBg', 'images/rank_bg.png'),
        this.resourceLoader.loadImage('firstRank', 'images/rank_1.png'),
        this.resourceLoader.loadImage('secondRank', 'images/rank_2.png'),
        this.resourceLoader.loadImage('thirdRank', 'images/rank_3.png'),
        this.resourceLoader.loadImage('prevBtn', 'images/prev_btn.png'),
        this.resourceLoader.loadImage('nextBtn', 'images/next_btn.png')
      ])
    } catch (error) {
      console.error('加载资源失败', error)
    }
  }
  
  // 初始化画布
  initCanvas() {
    wx.getOpenDataContext().onMessage(data => {
      if (data.event === 'updateViewPort') {
        canvasWidth = data.width
        canvasHeight = data.height
        this.render()
      }
    })
  }
  
  // 初始化消息监听
  initMessageListener() {
    wx.onMessage(message => {
      console.log('开放数据域收到消息:', message)
      
      if (!message) return
      
      const { event, data } = message
      
      switch (event) {
        case 'updateViewPort':
          // 更新视图大小
          canvasWidth = data.width
          canvasHeight = data.height
          this.render()
          break
          
        case 'showRanking':
          // 显示排行榜
          this.gameId = data.gameId || ''
          this.rankType = data.rankType || 'score'
          this.timeRange = data.timeRange || 'all'
          this.loadRankingData()
          break
          
        case 'nextPage':
          // 下一页
          if (this.currentPage < this.totalPages - 1) {
            this.currentPage++
            this.render()
          }
          break
          
        case 'prevPage':
          // 上一页
          if (this.currentPage > 0) {
            this.currentPage--
            this.render()
          }
          break
          
        default:
          console.warn('未知的消息事件:', event)
      }
    })
  }
  
  // 加载排行榜数据
  loadRankingData() {
    // 根据游戏ID和排行类型获取对应的排行榜
    let rankKey = `${this.gameId}_${this.rankType}`
    if (this.timeRange !== 'all') {
      rankKey += `_${this.timeRange}`
    }
    
    // 获取好友排行榜
    wx.getFriendCloudStorage({
      keyList: [rankKey],
      success: res => {
        console.log('获取排行榜数据成功:', res)
        
        // 处理排行榜数据
        this.processRankingData(res.data, rankKey)
        
        // 获取自己的排名
        this.loadSelfRankingData(rankKey)
      },
      fail: err => {
        console.error('获取排行榜数据失败:', err)
        this.showError('获取排行榜失败')
      }
    })
  }
  
  // 处理排行榜数据
  processRankingData(data, rankKey) {
    // 提取并排序数据
    this.rankingData = data
      .map(item => {
        // 查找对应的KV数据
        const kvData = item.KVDataList.find(kv => kv.key === rankKey)
        
        if (!kvData) return null
        
        // 解析分数
        let score = 0
        try {
          const scoreData = JSON.parse(kvData.value)
          score = this.rankType === 'time' ? scoreData.time : scoreData.score
        } catch (e) {
          console.error('解析分数数据失败:', e)
          score = 0
        }
        
        return {
          openid: item.openid,
          nickname: item.nickname,
          avatarUrl: item.avatarUrl,
          score: score
        }
      })
      .filter(item => item !== null)
      
    // 根据分数排序
    if (this.rankType === 'time') {
      // 时间类型，小的在前
      this.rankingData.sort((a, b) => a.score - b.score)
    } else {
      // 分数类型，大的在前
      this.rankingData.sort((a, b) => b.score - a.score)
    }
    
    // 计算总页数
    this.totalPages = Math.ceil(this.rankingData.length / this.pageSize) || 1
    this.currentPage = 0
    
    // 渲染排行榜
    this.render()
  }
  
  // 加载自己的排名数据
  loadSelfRankingData(rankKey) {
    wx.getUserCloudStorage({
      keyList: [rankKey],
      success: res => {
        console.log('获取自己的排名数据成功:', res)
        
        // 查找对应的KV数据
        const kvData = res.KVDataList.find(kv => kv.key === rankKey)
        
        if (kvData) {
          // 解析分数
          let score = 0
          try {
            const scoreData = JSON.parse(kvData.value)
            score = this.rankType === 'time' ? scoreData.time : scoreData.score
          } catch (e) {
            console.error('解析分数数据失败:', e)
            score = 0
          }
          
          // 获取自己的基本信息
          wx.getUserInfo({
            openIdList: ['selfOpenId'],
            success: userRes => {
              const userInfo = userRes.data[0]
              
              this.selfData = {
                openid: userInfo.openId,
                nickname: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                score: score
              }
              
              // 查找自己的排名
              const selfRank = this.rankingData.findIndex(item => item.openid === this.selfData.openid)
              if (selfRank !== -1) {
                this.selfData.rank = selfRank + 1
              } else {
                this.selfData.rank = '未上榜'
              }
              
              this.render()
            }
          })
        }
      },
      fail: err => {
        console.error('获取自己的排名数据失败:', err)
      }
    })
  }
  
  // 渲染排行榜
  render() {
    if (!canvasWidth || !canvasHeight) return
    
    // 清空画布
    context.clearRect(0, 0, canvasWidth, canvasHeight)
    
    // 绘制背景
    this.drawBackground()
    
    // 绘制标题
    this.drawTitle()
    
    // 绘制排行榜列表
    this.drawRankingList()
    
    // 绘制分页控制
    this.drawPagination()
    
    // 绘制自己的排名
    if (this.selfData) {
      this.drawSelfRanking()
    }
  }
  
  // 绘制背景
  drawBackground() {
    const bgImage = this.resourceLoader.get('rankBg')
    if (bgImage) {
      context.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight)
    } else {
      // 默认背景
      context.fillStyle = 'rgba(0, 0, 0, 0.6)'
      context.fillRect(0, 0, canvasWidth, canvasHeight)
    }
  }
  
  // 绘制标题
  drawTitle() {
    context.fillStyle = '#ffffff'
    context.font = 'bold 20px Arial'
    context.textAlign = 'center'
    
    let title = '好友排行榜'
    if (this.gameId) {
      const gameNames = {
        'game1': '贪吃蛇',
        'game2': '2048',
        'game3': '飞机大战'
      }
      title = `${gameNames[this.gameId] || '游戏'}排行榜`
    }
    
    context.fillText(title, canvasWidth / 2, 40)
  }
  
  // 绘制排行榜列表
  drawRankingList() {
    const startIndex = this.currentPage * this.pageSize
    const endIndex = Math.min(startIndex + this.pageSize, this.rankingData.length)
    
    if (this.rankingData.length === 0) {
      // 没有数据
      context.fillStyle = '#ffffff'
      context.font = '16px Arial'
      context.textAlign = 'center'
      context.fillText('暂无排行数据', canvasWidth / 2, canvasHeight / 2)
      return
    }
    
    // 绘制表头
    context.fillStyle = '#ffffff'
    context.font = 'bold 16px Arial'
    context.textAlign = 'left'
    context.fillText('排名', 50, 80)
    context.fillText('头像', 120, 80)
    context.fillText('昵称', 220, 80)
    context.fillText(this.rankType === 'time' ? '用时' : '分数', 320, 80)
    
    // 绘制分割线
    context.strokeStyle = '#ffffff'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(30, 90)
    context.lineTo(canvasWidth - 30, 90)
    context.stroke()
    
    // 绘制列表项
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.rankingData[i]
      const y = 130 + (i - startIndex) * 60
      
      // 绘制排名
      context.fillStyle = '#ffffff'
      context.font = 'bold 18px Arial'
      context.textAlign = 'center'
      
      if (i < 3) {
        // 前三名使用图标
        const rankImages = [this.resourceLoader.get('firstRank'), this.resourceLoader.get('secondRank'), this.resourceLoader.get('thirdRank')]
        const rankImage = rankImages[i]
        
        if (rankImage) {
          context.drawImage(rankImage, 40, y - 25, 30, 30)
        } else {
          context.fillText(i + 1, 50, y)
        }
      } else {
        context.fillText(i + 1, 50, y)
      }
      
      // 绘制头像
      const defaultAvatar = this.resourceLoader.get('defaultAvatar')
      if (item.avatarUrl) {
        // 加载玩家头像
        const avatar = wx.createImage()
        avatar.src = item.avatarUrl
        avatar.onload = () => {
          // 绘制圆形头像
          context.save()
          context.beginPath()
          context.arc(120, y - 10, 20, 0, Math.PI * 2, false)
          context.clip()
          context.drawImage(avatar, 100, y - 30, 40, 40)
          context.restore()
        }
        avatar.onerror = () => {
          // 使用默认头像
          if (defaultAvatar) {
            context.drawImage(defaultAvatar, 100, y - 30, 40, 40)
          }
        }
      } else if (defaultAvatar) {
        context.drawImage(defaultAvatar, 100, y - 30, 40, 40)
      }
      
      // 绘制昵称
      context.fillStyle = '#ffffff'
      context.font = '16px Arial'
      context.textAlign = 'left'
      const nickname = item.nickname || '未知玩家'
      // 昵称过长时截断
      const maxWidth = 100
      if (context.measureText(nickname).width > maxWidth) {
        let shortName = ''
        for (let j = 0; j < nickname.length; j++) {
          shortName += nickname[j]
          if (context.measureText(shortName + '...').width > maxWidth) {
            shortName = shortName.slice(0, -1) + '...'
            break
          }
        }
        context.fillText(shortName, 180, y)
      } else {
        context.fillText(nickname, 180, y)
      }
      
      // 绘制分数
      context.fillStyle = '#ffcc00'
      context.font = 'bold 18px Arial'
      context.textAlign = 'left'
      
      if (this.rankType === 'time') {
        // 时间格式化
        const time = item.score
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        const timeText = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`
        context.fillText(timeText, 320, y)
      } else {
        context.fillText(item.score, 320, y)
      }
    }
  }
  
  // 绘制分页控制
  drawPagination() {
    if (this.totalPages <= 1) return
    
    const y = canvasHeight - 50
    
    // 绘制页码信息
    context.fillStyle = '#ffffff'
    context.font = '14px Arial'
    context.textAlign = 'center'
    context.fillText(`${this.currentPage + 1}/${this.totalPages}`, canvasWidth / 2, y)
    
    // 绘制上一页按钮
    const prevBtn = this.resourceLoader.get('prevBtn')
    if (prevBtn && this.currentPage > 0) {
      context.drawImage(prevBtn, canvasWidth / 2 - 80, y - 15, 30, 30)
    }
    
    // 绘制下一页按钮
    const nextBtn = this.resourceLoader.get('nextBtn')
    if (nextBtn && this.currentPage < this.totalPages - 1) {
      context.drawImage(nextBtn, canvasWidth / 2 + 50, y - 15, 30, 30)
    }
  }
  
  // 绘制自己的排名
  drawSelfRanking() {
    const y = canvasHeight - 100
    
    // 绘制背景
    context.fillStyle = 'rgba(0, 0, 0, 0.5)'
    context.fillRect(30, y - 30, canvasWidth - 60, 60)
    
    // 绘制标题
    context.fillStyle = '#ffffff'
    context.font = 'bold 16px Arial'
    context.textAlign = 'left'
    context.fillText('我的排名', 50, y - 10)
    
    // 绘制排名
    context.fillStyle = '#ffcc00'
    context.font = 'bold 18px Arial'
    context.textAlign = 'center'
    context.fillText(this.selfData.rank, 50, y + 15)
    
    // 绘制头像
    const defaultAvatar = this.resourceLoader.get('defaultAvatar')
    if (this.selfData.avatarUrl) {
      // 加载玩家头像
      const avatar = wx.createImage()
      avatar.src = this.selfData.avatarUrl
      avatar.onload = () => {
        // 绘制圆形头像
        context.save()
        context.beginPath()
        context.arc(120, y, 20, 0, Math.PI * 2, false)
        context.clip()
        context.drawImage(avatar, 100, y - 20, 40, 40)
        context.restore()
      }
      avatar.onerror = () => {
        // 使用默认头像
        if (defaultAvatar) {
          context.drawImage(defaultAvatar, 100, y - 20, 40, 40)
        }
      }
    } else if (defaultAvatar) {
      context.drawImage(defaultAvatar, 100, y - 20, 40, 40)
    }
    
    // 绘制昵称
    context.fillStyle = '#ffffff'
    context.font = '16px Arial'
    context.textAlign = 'left'
    const nickname = this.selfData.nickname || '未知玩家'
    context.fillText(nickname, 180, y + 5)
    
    // 绘制分数
    context.fillStyle = '#ffcc00'
    context.font = 'bold 18px Arial'
    context.textAlign = 'left'
    
    if (this.rankType === 'time') {
      // 时间格式化
      const time = this.selfData.score
      const minutes = Math.floor(time / 60)
      const seconds = time % 60
      const timeText = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`
      context.fillText(timeText, 320, y + 5)
    } else {
      context.fillText(this.selfData.score, 320, y + 5)
    }
  }
  
  // 显示错误信息
  showError(message) {
    context.clearRect(0, 0, canvasWidth, canvasHeight)
    
    // 绘制背景
    context.fillStyle = 'rgba(0, 0, 0, 0.6)'
    context.fillRect(0, 0, canvasWidth, canvasHeight)
    
    // 绘制错误信息
    context.fillStyle = '#ff0000'
    context.font = 'bold 18px Arial'
    context.textAlign = 'center'
    context.fillText(message, canvasWidth / 2, canvasHeight / 2)
  }
}

// 创建排行榜渲染器实例
const rankingRenderer = new RankingRenderer()
