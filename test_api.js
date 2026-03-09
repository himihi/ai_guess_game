// 简单测试智谱 AI API 是否可用
const fs = require('fs');
const path = require('path');

// 读取 .env 文件获取 API Key
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/VITE_ZHIPU_API_KEY=(.*)/);

if (!apiKeyMatch || !apiKeyMatch[1]) {
  console.log('❌ 未找到 API Key，请在 .env 文件中配置');
  process.exit(1);
}

const apiKey = apiKeyMatch[1].trim();
console.log('✅ API Key 已配置:', apiKey.substring(0, 20) + '...');

// 创建一个简单的测试图片（纯白色）
const canvas = require('canvas');
const c = canvas.createCanvas(500, 400);
const ctx = c.getContext('2d');
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, 500, 400);
// 画一个简单的圆圈代表太阳
ctx.strokeStyle = '#FFD700';
ctx.lineWidth = 5;
ctx.beginPath();
ctx.arc(250, 200, 50, 0, Math.PI * 2);
ctx.stroke();

const base64Image = c.toDataURL('image/png').split(',')[1];
console.log('📸 测试图片生成成功 (Base64 长度):', base64Image.length);

async function testZhipuAPI() {
  try {
    console.log('\n🚀 正在调用智谱 AI...');
    
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'cogview-3.5',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: '请用简洁的中文描述这张手绘图的内容，只输出一个词语或短语（如"太阳"、"苹果"）。如果看不出来是什么，请说"看不清楚"。'
              }
            ]
          }
        ],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 请求失败：${response.status} - ${errorData.message || ''}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || '未知';
    
    console.log('\n✨ AI 识别结果:', description);
    console.log('✅ API 测试成功！');
    
  } catch (error) {
    console.error('\n❌ API 测试失败:', error.message);
  }
}

testZhipuAPI();
