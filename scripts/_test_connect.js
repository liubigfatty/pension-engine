// 最终方案：用 cli.js 而不是 cli.bat（避免 .bat 的编码问题）
const { execSync } = require('child_process');
const path = require('path');
const automator = require('miniprogram-automator');

const PROJECT_PATH = path.join(__dirname, '..');
const CLI_JS = 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.js';
const NODE_EXE = 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\node.exe';

console.log('=== 用 node.exe + cli.js 启动自动化 ===\n');
console.log(`node: ${NODE_EXE}`);
console.log(`cli: ${CLI_JS}`);
console.log(`project: ${PROJECT_PATH}\n`);

try {
  // 先关闭已有实例
  try { execSync('taskkill /F /IM wechatdevtools.exe', { stdio: 'pipe' }); } catch(e) {}
  try { execSync('taskkill /F /IM WeChatAppEx.exe', { stdio: 'pipe' }); } catch(e) {}
  
  console.log('已关闭旧实例，等待3秒...');
  
} catch(e) {}

// 延迟后启动
setTimeout(async () => {
  console.log('\n启动开发者工具...');
  
  // 用 spawn 直接调用 node.exe + cli.js
  const { spawn } = require('child_process');
  const proc = spawn(NODE_EXE, [CLI_JS, 'auto', '--project', PROJECT_PATH], {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具'
  });
  
  let output = '';
  proc.stdout.on('data', d => { output += d.toString(); process.stdout.write(d); });
  proc.stderr.on('data', d => { output += d.toString(); process.stderr.write(d); });
  
  // 等30秒让工具启动
  await new Promise(r => setTimeout(r, 30000));
  
  // 扫描端口
  console.log('\n扫描端口...');
  const portsOutput = execSync('netstat -ano | findstr LISTENING | findstr "127.0.0.1"', { encoding: 'utf8' });
  const allPorts = [...portsOutput.matchAll(/127\.0\.0\.1:(\d+)/g)].map(m => parseInt(m[1]));
  
  const WebSocket = require('ws');
  for (const port of allPorts) {
    process.stdout.write(`  端口 ${port}: `);
    try {
      const result = await new Promise((resolve) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`);
        const timer = setTimeout(() => resolve(null), 2000);
        ws.on('open', () => {
          ws.send(JSON.stringify({ id: 1, method: 'Tool.getInfo', params: {} }));
        });
        ws.on('message', d => { clearTimeout(timer); resolve(d.toString()); ws.close(); });
        ws.on('error', () => { clearTimeout(timer); resolve(null); });
        ws.on('close', () => { clearTimeout(timer); resolve(null); });
      });
      
      if (result && result.includes('SDKVersion')) {
        console.log('✅ 自动化端点!');
        
        // 尝试 automator.connect
        process.stdout.write(`  → automator.connect ... `);
        try {
          const mp = await automator.connect({ wsEndpoint: `ws://127.0.0.1:${port}` });
          console.log('✅✅✅ 成功!!!');
          
          // 获取当前页面
          const page = await mp.currentPage();
          console.log(`当前页面: ${page.path || '(unknown)'}`);
          
          await mp.close();
          process.exit(0);
        } catch(e2) {
          console.log('❌', e2.message);
        }
      } else if (result) {
        console.log('WS(非automator)');
      } else {
        console.log('');
      }
    } catch(e) {}
  }
  
  console.log('\n未找到可用端点');
  process.exit(1);
}, 4000);
