/**
 * Word2Pic Chrome插件 - 主要功能脚本
 * 实现文字转图片的核心功能
 */

// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const textInput = document.getElementById('text-input');
  const generateBtn = document.getElementById('generate-btn');
  const saveBtn = document.getElementById('save-btn');
  const copyBtn = document.getElementById('copy-btn');
  const aiSummaryBtn = document.getElementById('ai-summary-btn');
  const imagePreview = document.getElementById('image-preview');
  const styleOptions = document.querySelectorAll('.style-option');
  
  // 当前选择的样式
  let currentStyle = 'simple';
  let generatedImage = null;
  
  // 初始化选择第一个样式
  styleOptions[0].classList.add('selected');
  
  // 为样式选项添加点击事件
  styleOptions.forEach(option => {
    option.addEventListener('click', function() {
      // 移除所有选中状态
      styleOptions.forEach(opt => opt.classList.remove('selected'));
      // 添加当前选中状态
      this.classList.add('selected');
      // 更新当前样式
      currentStyle = this.getAttribute('data-style');
      
      // 如果已经生成过图片，则重新生成
      if (generatedImage) {
        generateImage();
      }
    });
  });
  
  // 生成按钮点击事件
  generateBtn.addEventListener('click', function() {
    generateImage();
  });
  
  // 保存按钮点击事件
  saveBtn.addEventListener('click', function() {
    if (generatedImage) {
      // 创建下载链接
      const link = document.createElement('a');
      link.download = 'word2pic_' + new Date().getTime() + '.png';
      link.href = generatedImage;
      link.click();
    }
  });
  
  // 复制按钮点击事件
  copyBtn.addEventListener('click', function() {
    if (generatedImage) {
      // 创建一个临时的canvas元素
      const tempCanvas = document.createElement('canvas');
      const img = new Image();
      img.onload = function() {
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // 将canvas转换为blob并复制到剪贴板
        tempCanvas.toBlob(function(blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(function() {
            alert('图片已复制到剪贴板！');
          }).catch(function(error) {
            console.error('复制失败: ', error);
            alert('复制失败，请重试！');
          });
        });
      };
      img.src = generatedImage;
    }
  });
  
  // AI总结按钮点击事件
  aiSummaryBtn.addEventListener('click', function() {
    const text = textInput.value.trim();
    
    if (!text) {
      alert('请输入文字内容！');
      return;
    }
    
    // 显示加载状态
    aiSummaryBtn.textContent = '正在总结...';
    aiSummaryBtn.disabled = true;
    
    // 调用火山方舟大模型API
    summarizeText(text)
      .then(summary => {
        // 更新文本框内容
        textInput.value = summary;
        
        // 恢复按钮状态
        aiSummaryBtn.textContent = 'AI总结文字';
        aiSummaryBtn.disabled = false;
      })
      .catch(error => {
        console.error('总结失败: ', error);
        alert('总结失败，请重试！');
        
        // 恢复按钮状态
        aiSummaryBtn.textContent = 'AI总结文字';
        aiSummaryBtn.disabled = false;
      });
  });
  
  /**
   * 生成图片的核心函数
   */
  function generateImage() {
    const text = textInput.value.trim();
    
    if (!text) {
      alert('请输入文字内容！');
      return;
    }
    
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布尺寸（固定宽度，高度根据内容自适应）
    const width = 300;
    let height = 400; // 初始高度，后续会根据文本内容调整
    
    canvas.width = width;
    
    // 根据不同风格设置不同的样式
    let backgroundColor, textColor, fontFamily, padding;
    
    switch (currentStyle) {
      case 'simple':
        backgroundColor = '#f8f9fa';
        textColor = '#333333';
        fontFamily = 'PingFang SC, Microsoft YaHei, sans-serif';
        padding = 30;
        break;
      case 'literary':
        backgroundColor = '#f5efe0';
        textColor = '#5d4037';
        fontFamily = 'KaiTi, STKaiti, serif';
        padding = 40;
        break;
      case 'business':
        backgroundColor = '#263238';
        textColor = '#ffffff';
        fontFamily = 'Helvetica, Arial, sans-serif';
        padding = 30;
        break;
      case 'colorful':
        backgroundColor = '#ff9a9e';
        textColor = '#ffffff';
        fontFamily = 'PingFang SC, Microsoft YaHei, sans-serif';
        padding = 35;
        break;
      default:
        backgroundColor = '#f8f9fa';
        textColor = '#333333';
        fontFamily = 'PingFang SC, Microsoft YaHei, sans-serif';
        padding = 30;
    }
    
    // 设置字体和文本样式
    const fontSize = 18;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // 计算文本换行
    const maxWidth = width - (padding * 2);
    const lines = getTextLines(text, maxWidth, ctx);
    
    // 计算实际需要的高度
    const lineHeight = fontSize * 1.5;
    const textHeight = lines.length * lineHeight;
    height = textHeight + (padding * 2) + 60; // 额外空间用于底部署名等
    
    // 重新设置canvas高度
    canvas.height = height;
    
    // 绘制背景
    if (currentStyle === 'colorful') {
      // 创建渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#ff9a9e');
      gradient.addColorStop(1, '#fad0c4');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = backgroundColor;
    }
    ctx.fillRect(0, 0, width, height);
    
    // 绘制文本
    ctx.fillStyle = textColor;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const y = padding + (i * lineHeight);
      ctx.fillText(line, width / 2, y);
    }
    
    // 绘制底部装饰
    if (currentStyle === 'literary') {
      // 文艺风格添加引号装饰
      ctx.font = '60px Georgia';
      ctx.fillStyle = 'rgba(93, 64, 55, 0.1)';
      ctx.fillText('"', 40, 40);
      ctx.fillText('"', width - 40, height - 80);
    } else if (currentStyle === 'business') {
      // 商务风格添加横线
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, height - 40);
      ctx.lineTo(width - padding, height - 40);
      ctx.stroke();
    }
    
    // 将canvas转换为图片URL
    generatedImage = canvas.toDataURL('image/png');
    
    // 更新预览
    imagePreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = generatedImage;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    imagePreview.appendChild(img);
    
    // 启用保存和复制按钮
    saveBtn.disabled = false;
    copyBtn.disabled = false;
  }
  
  /**
   * 将文本分割成多行以适应指定宽度
   * @param {string} text - 要分割的文本
   * @param {number} maxWidth - 每行最大宽度
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @return {string[]} 分割后的文本行数组
   */
  function getTextLines(text, maxWidth, ctx) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + word).width;
      
      if (width < maxWidth) {
        currentLine += word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  /**
   * 调用火山方舟大模型API进行文本总结
   * @param {string} text - 需要总结的文本
   * @returns {Promise<string>} - 总结后的文本
   */
  async function summarizeText(text) {
    const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const API_KEY = 'ad7a6826-a8d8-42ec-a8de-0a5893a477ca';
    
    const requestData = {
      model: "doubao-seed-1-6-vision-250815",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `请对以下文本进行简洁的总结，保留核心内容：\n\n${text}`
            }
          ]
        }
      ]
    };
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 从响应中提取总结文本
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else {
        throw new Error('API响应格式不正确');
      }
    } catch (error) {
      console.error('调用大模型API失败:', error);
      throw error;
    }
  }
});