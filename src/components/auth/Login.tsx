import React, { useState, useEffect, useRef } from 'react';

// ====== 登录相关工具函数 ======

export function getCurrentUser(): { username: string; displayName: string; role: string } | null {
  try {
    const authStr = localStorage.getItem('zhiquality_auth');
    if (!authStr) return null;
    const auth = JSON.parse(authStr);
    return {
      username: auth.username || '',
      displayName: auth.username || '',
      role: auth.role || '用户',
    };
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('zhiquality_auth');
}

// ====== 登录页面组件 - 全球数字化智能制造平台入口 ======
export default function Login({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState<'username' | 'password' | null>(null);

  // Canvas引用
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 科技文字容器引用（用于计算扫光终点距离）
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ========== 登录处理 ==========
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const usersStr = localStorage.getItem('zhiquality_users');
      const users = usersStr ? JSON.parse(usersStr) : [
        { username: 'chenyu', password: 'chenyu312', role: '管理员' }
      ];

      const user = users.find(
        (u: { username: string; password: string }) =>
          u.username === username && u.password === password
      );

      if (user) {
        localStorage.setItem(
          'zhiquality_auth',
          JSON.stringify({
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString(),
          })
        );

        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.reload();
        }
      } else {
        setError('用户名或密码错误');
        setIsLoading(false);
      }
    }, 800);
  };

  // ========== 完整Canvas动画系统 ==========
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let floatingInitTimer = 0;
    let setCanvasSize: (() => void) | null = null;
    let disposed = false;

    // 延迟初始化确保DOM已加载
    const initTimer = setTimeout(() => {
      if (disposed) return;

      // 设置画布尺寸（高分辨率支持Retina屏）
      setCanvasSize = () => {
        const parent = canvas.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          canvas.width = rect.width * 2;
          canvas.height = rect.height * 2;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
        }
      };

      setCanvasSize();
      window.addEventListener('resize', setCanvasSize);

      // ====== 动画状态变量 ======
      // 初始旋转角度：让杭州居中偏上，阿联酋在左下，印尼在右下，三个点均正面可见
      let rotation = 1.31;
      let frameCount = 0;

      // ====== 长流星科技雨系统 ======
      interface Meteor {
        x: number;
        y: number;
        length: number;
        speed: number;
        opacity: number;
        width: number;
        hue: number;
        phase: number;
        drift: number;
      }

      const meteors: Meteor[] = [];
      const METEOR_COUNT = 130;

      function createMeteor(): Meteor {
        return {
          x: Math.random() * (canvas.width / 2),
          y: (canvas.height / 2) + Math.random() * 250,
          length: 90 + Math.random() * 220,
          speed: 1.2 + Math.random() * 4.5,
          opacity: 0.03 + Math.random() * 0.14,
          width: 0.4 + Math.random() * 2,
          hue: 185 + Math.random() * 50,
          phase: Math.random() * Math.PI * 2,
          drift: (Math.random() - 0.5) * 0.5,
        };
      }

      for (let i = 0; i < METEOR_COUNT; i++) {
        meteors.push(createMeteor());
      }

      // ====== 科技粒子系统 ======
      interface TechParticle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        opacity: number;
        hue: number;
      }

      const particles: TechParticle[] = [];
      const PARTICLE_COUNT = 70;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * (canvas.width / 2),
          y: Math.random() * (canvas.height / 2),
          vx: (Math.random() - 0.5) * 0.25,
          vy: -0.15 - Math.random() * 0.4,
          size: 0.4 + Math.random() * 2,
          opacity: 0.08 + Math.random() * 0.28,
          hue: 190 + Math.random() * 40,
        });
      }

      // ====== 科技漂浮文字系统 ======
      // 8个科技文字在页面中自由漂浮，并自动避开三维地球区域
      interface FloatingText {
        el: HTMLDivElement | null;
        x: number;
        y: number;
        vx: number;
        vy: number;
        targetVx: number;
        targetVy: number;
        baseSpeed: number;
        phase: number;
        changeInterval: number;
        lastChange: number;
        size: number;
      }

      const floatingTexts: FloatingText[] = [];

      // 初始百分比位置（相对于左侧 65% 面板）与基础速度分组
      // 左侧已放置功能卖点区，漂浮文字仅在右侧边缘保留，避免重叠
      const textConfigs = [
        { top: 0.10, left: 0.90, speed: 0.16, group: 'right' },
        { top: 0.30, left: 0.93, speed: 0.14, group: 'right' },
        { top: 0.56, left: 0.91, speed: 0.15, group: 'right' },
        { top: 0.82, left: 0.92, speed: 0.13, group: 'right' },
      ];

      const pickNewDirection = (ft: FloatingText) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = ft.baseSpeed * (0.6 + Math.random() * 0.5);
        ft.targetVx = Math.cos(angle) * speed;
        ft.targetVy = Math.sin(angle) * speed;
        ft.changeInterval = 240 + Math.random() * 360; // 4-10秒 @60fps
      };

      // 等待DOM元素挂载后初始化
      const initFloatingTexts = () => {
        floatingTexts.length = 0;
        const width = canvas.width / 2;
        const height = canvas.height / 2;

        textConfigs.forEach((cfg, i) => {
          const el = textRefs.current[i];
          const size = el
            ? Math.max(el.offsetWidth, el.offsetHeight, 60)
            : 80;
          const ft: FloatingText = {
            el,
            x: cfg.left * width,
            y: cfg.top * height,
            vx: 0,
            vy: 0,
            targetVx: 0,
            targetVy: 0,
            baseSpeed: cfg.speed,
            phase: Math.random() * Math.PI * 2,
            changeInterval: 60 + Math.random() * 120,
            lastChange: 0,
            size,
          };
          pickNewDirection(ft);
          ft.vx = ft.targetVx;
          ft.vy = ft.targetVy;
          floatingTexts.push(ft);
        });
      };

      initFloatingTexts();
      floatingInitTimer = window.setTimeout(initFloatingTexts, 200);

      const updateFloatingTexts = (frame: number) => {
        const width = canvas.width / 2;
        const height = canvas.height / 2;
        const margin = 40; // 页面边缘留白
        const earthSafeRadius = globeR + 70; // 地球禁入区域半径（略微收紧，让可用空间更大）
        const textSeparation = 130; // 文字间最小舒适距离

        floatingTexts.forEach(ft => {
          if (!ft.el) return;

          // 定期平滑改变目标方向
          ft.lastChange++;
          if (ft.lastChange >= ft.changeInterval) {
            pickNewDirection(ft);
            ft.lastChange = 0;
          }

          // 速度向目标速度缓动（更慢、更柔和）
          ft.vx += (ft.targetVx - ft.vx) * 0.008;
          ft.vy += (ft.targetVy - ft.vy) * 0.008;

          // 叠加轻微噪声，让轨迹更自然
          const noiseX = Math.sin(frame * 0.005 + ft.phase) * 0.05;
          const noiseY = Math.cos(frame * 0.006 + ft.phase * 1.3) * 0.05;

          // 更新位置
          ft.x += ft.vx + noiseX;
          ft.y += ft.vy + noiseY;

          // 页面边界非常柔和的反弹
          if (ft.x < margin) {
            ft.x = margin;
            ft.vx *= -0.25;
            ft.targetVx = Math.abs(ft.targetVx) * 0.4 + 0.05;
          }
          if (ft.x > width - ft.size - margin) {
            ft.x = width - ft.size - margin;
            ft.vx *= -0.25;
            ft.targetVx = -Math.abs(ft.targetVx) * 0.4 - 0.05;
          }
          if (ft.y < margin) {
            ft.y = margin;
            ft.vy *= -0.25;
            ft.targetVy = Math.abs(ft.targetVy) * 0.4 + 0.05;
          }
          if (ft.y > height - ft.size - margin) {
            ft.y = height - ft.size - margin;
            ft.vy *= -0.25;
            ft.targetVy = -Math.abs(ft.targetVy) * 0.4 - 0.05;
          }

          // 地球禁入区域检测：文字中心到地球中心的距离
          const centerX = ft.x + ft.size * 0.5;
          const centerY = ft.y + ft.size * 0.5;
          const dx = centerX - globeCx;
          const dy = centerY - globeCy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < earthSafeRadius) {
            // 计算远离地球的单位向量
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            const push = (earthSafeRadius - dist) / earthSafeRadius;
            const pushStrength = 1.2 + push * 1.8;

            // 施加柔和排斥力
            ft.vx += nx * pushStrength;
            ft.vy += ny * pushStrength;
            ft.targetVx += nx * pushStrength * 0.3;
            ft.targetVy += ny * pushStrength * 0.3;

            // 柔和地将位置推到安全区外
            const safeX = globeCx + nx * earthSafeRadius;
            const safeY = globeCy + ny * earthSafeRadius;
            const lerp = 0.08 + push * 0.12;
            ft.x += (safeX - centerX) * lerp - ft.size * 0.5;
            ft.y += (safeY - centerY) * lerp - ft.size * 0.5;
          }

          // 应用位置
          ft.el.style.left = `${ft.x}px`;
          ft.el.style.top = `${ft.y}px`;
        });

        // 文字间微弱排斥力：避免彼此聚集/重叠
        for (let i = 0; i < floatingTexts.length; i++) {
          const a = floatingTexts[i];
          if (!a.el) continue;
          const ax = a.x + a.size * 0.5;
          const ay = a.y + a.size * 0.5;

          for (let j = i + 1; j < floatingTexts.length; j++) {
            const b = floatingTexts[j];
            if (!b.el) continue;
            const bx = b.x + b.size * 0.5;
            const by = b.y + b.size * 0.5;
            const dx = bx - ax;
            const dy = by - ay;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < textSeparation && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              const force = (textSeparation - dist) / textSeparation * 0.15;

              a.vx -= nx * force;
              a.vy -= ny * force;
              b.vx += nx * force;
              b.vy += ny * force;
            }
          }
        }
      };

      // ====== 地点数据（真实经纬度） ======
      // 杭州：总部
      // 阿联酋：境外合作生产加工点（阿布扎比附近）
      // 印尼：境外合作生产加工点（印尼东部真实坐标，确保在杭州东南方向）
      const locations = [
        {
          name: '杭州总部·浙江中烟',
          subName: 'Hangzhou HQ',
          lat: 30.29,
          lng: 120.16,
          color: '#60a5fa',
          type: 'hq',
        },
        {
          name: '阿联酋·环球烟草',
          subName: 'UAE Partner',
          lat: 23.42,
          lng: 53.85,
          color: '#22d3ee',
          type: 'partner',
        },
        {
          name: '印尼·科伦印象',
          subName: 'Indonesia Partner',
          lat: -2.5,
          lng: 106.0,
          color: '#34d399',
          type: 'partner',
        },
      ];

      // ====== 经纬度转3D球面坐标 ======
      // 关键：x轴取负，确保经度越小（越西）在屏幕左侧，经度越大（越东）在屏幕右侧
      // latitude: 北纬为正，南纬为负
      // longitude: 东经为正，西经为负
      const latLngTo3D = (lat: number, lng: number, radius: number) => {
        const latRad = (lat * Math.PI) / 180;
        const lngRad = ((lng - rotation * 57.3) * Math.PI) / 180;
        // x取负：东经地点出现在屏幕右侧
        const x = -radius * Math.cos(latRad) * Math.cos(lngRad);
        const y = -radius * Math.sin(latRad);
        const z = radius * Math.cos(latRad) * Math.sin(lngRad);
        return { x, y, z };
      };

      // ====== 3D球面坐标转2D屏幕坐标 ======
      const project3D = (x: number, y: number, z: number) => ({
        x: globeCx + x,
        y: globeCy + y * 0.82,
        z: z,
      });

      // ====== 绘制3D空间弧线（绑定地球表面） ======
      const draw3DArc = (p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }, color: string, alpha: number) => {
        // 计算两点在3D空间中的中点，并向外突出形成弧线
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const midZ = (p1.z + p2.z) / 2;

        // 弧线向外突出，远离球心
        const dist = Math.sqrt(midX * midX + midY * midY + midZ * midZ);
        const bulge = 1.16;
        const arcX = midX / dist * globeR * bulge;
        const arcY = midY / dist * globeR * bulge;
        const arcZ = midZ / dist * globeR * bulge;

        const pp1 = project3D(p1.x, p1.y, p1.z);
        const pp2 = project3D(arcX, arcY, arcZ);
        const pp3 = project3D(p2.x, p2.y, p2.z);

        // 只绘制在地球前方的部分
        if (pp1.z < -globeR * 0.45 || pp3.z < -globeR * 0.45) return;

        // 高端科技蓝连接线 - 多层发光
        const gradient = ctx.createLinearGradient(pp1.x, pp1.y, pp3.x, pp3.y);
        gradient.addColorStop(0, 'rgba(165, 243, 252, 0.85)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.75)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.65)');

        // 外层光晕
        ctx.save();
        ctx.shadowColor = 'rgba(96, 165, 250, 0.6)';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(pp1.x, pp1.y);
        ctx.quadraticCurveTo(pp2.x, pp2.y, pp3.x, pp3.y);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.18)';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();

        // 中层光晕
        ctx.save();
        ctx.shadowColor = 'rgba(165, 243, 252, 0.5)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(pp1.x, pp1.y);
        ctx.quadraticCurveTo(pp2.x, pp2.y, pp3.x, pp3.y);
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // 主线
        ctx.beginPath();
        ctx.moveTo(pp1.x, pp1.y);
        ctx.quadraticCurveTo(pp2.x, pp2.y, pp3.x, pp3.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        return { pp1, pp2, pp3 };
      };

      // ====== 标准世界地图海陆轮廓（[纬度, 经度]，含主要岛屿） ======
      const coastlinePolygons = [
        // —— 七大洲主体 ——
        {
          name: 'Africa',
          points: [
            [37.0, 9.5], [36.8, 10.5], [33.2, 11.5], [32.5, 15.0], [31.5, 20.0],
            [32.0, 24.5], [31.2, 29.5], [31.5, 32.9], [29.5, 32.5], [27.0, 33.8],
            [24.0, 35.5], [22.0, 36.8], [18.0, 38.5], [15.5, 39.8], [12.5, 43.5],
            [11.8, 51.2], [10.5, 51.0], [5.0, 48.5], [2.0, 45.5], [-1.5, 42.0],
            [-5.0, 39.5], [-10.5, 40.5], [-15.0, 40.5], [-20.0, 36.0], [-25.5, 34.0],
            [-29.0, 32.0], [-32.0, 29.0], [-34.0, 25.5], [-34.8, 20.0], [-34.5, 18.4],
            [-32.0, 18.0], [-28.5, 16.5], [-22.0, 14.0], [-17.0, 12.0], [-12.5, 13.5],
            [-8.0, 13.2], [-5.0, 11.5], [-1.0, 9.0], [2.0, 9.8], [4.5, 8.0],
            [6.0, 4.0], [5.5, 0.0], [4.5, -5.0], [5.0, -9.0], [8.0, -13.0],
            [12.0, -16.5], [16.0, -16.5], [20.0, -17.0], [24.0, -15.5], [28.0, -13.0],
            [32.0, -9.5], [35.0, -6.0], [35.9, -5.5], [36.5, -1.0], [37.0, 3.0],
            [37.0, 9.5],
          ],
        },
        {
          name: 'Eurasia',
          points: [
            // 西欧 → 北欧 → 北极海岸 → 远东 → 中国沿海 → 中南半岛 → 印度 → 中东 → 地中海
            [36.0, -5.6], [38.8, -9.5], [41.2, -8.8], [43.4, -1.8], [46.0, -1.2],
            [48.5, -4.8], [50.0, -1.5], [51.2, 1.5], [52.0, 4.5], [53.5, 7.0],
            [55.0, 8.5], [57.0, 10.0], [59.0, 11.0], [61.0, 5.0], [63.5, 10.0],
            [66.0, 13.0], [69.0, 20.0], [71.0, 28.0], [72.0, 40.0], [73.0, 55.0],
            [73.5, 80.0], [73.0, 100.0], [72.0, 120.0], [71.0, 140.0], [70.0, 160.0],
            [68.0, 178.0], [66.0, 170.0], [62.0, 165.0], [58.0, 162.0], [54.0, 158.0],
            [51.0, 156.5], [46.0, 143.0], [43.0, 145.5], [44.0, 135.0], [42.5, 131.0],
            [40.0, 128.0], [39.0, 125.5], [38.0, 124.5], [37.5, 122.0], [36.0, 120.5],
            [34.5, 119.5], [32.0, 121.5], [31.0, 122.0], [29.5, 122.0], [28.0, 121.0],
            [26.0, 119.8], [24.5, 118.0], [23.0, 117.0], [22.5, 114.0], [21.8, 113.0],
            [21.5, 111.0], [21.0, 109.5], [20.0, 110.0], [18.5, 108.5], [16.0, 108.0],
            [13.0, 109.2], [10.5, 107.0], [8.5, 105.0], [4.0, 103.5], [1.5, 104.0],
            [1.3, 103.5], [5.5, 100.5], [8.0, 98.5], [12.0, 98.0], [16.0, 97.5],
            [20.0, 92.5], [22.0, 91.5], [22.0, 89.0], [21.5, 87.0], [20.0, 86.5],
            [16.0, 82.0], [13.5, 80.3], [10.0, 79.8], [8.1, 77.5], [9.5, 76.2],
            [12.0, 75.0], [15.0, 74.0], [18.0, 73.0], [20.5, 72.8], [22.5, 69.0],
            [23.5, 68.2], [25.0, 66.5], [25.5, 62.0], [24.5, 58.0], [25.0, 56.5],
            [26.0, 56.2], [26.5, 54.0], [25.0, 51.5], [26.5, 50.5], [29.0, 48.5],
            [30.0, 48.0], [29.5, 50.5], [27.0, 52.0], [25.0, 54.5], [23.0, 57.0],
            [20.0, 57.5], [17.0, 55.0], [15.0, 51.0], [14.0, 48.0], [16.0, 44.0],
            [18.0, 41.0], [21.5, 39.0], [25.0, 37.0], [28.0, 34.5], [29.5, 34.9],
            [31.3, 34.2], [33.0, 35.2], [35.0, 35.8], [36.5, 36.0], [36.8, 30.5],
            [38.0, 27.0], [39.0, 26.5], [40.0, 26.3], [40.5, 23.0], [40.0, 20.0],
            [41.0, 19.5], [42.0, 19.5], [43.0, 16.0], [45.5, 13.5], [44.8, 12.2],
            [43.5, 10.0], [43.0, 6.0], [43.3, 3.0], [41.5, 3.0], [39.0, 0.0],
            [36.8, -2.0], [36.0, -5.6],
          ],
        },
        {
          name: 'North America',
          points: [
            [50.0, -56.0], [53.0, -56.0], [57.0, -61.0], [60.0, -64.0], [62.5, -68.0],
            [66.0, -72.0], [70.0, -75.0], [73.0, -78.0], [74.0, -85.0], [73.0, -95.0],
            [72.0, -110.0], [71.0, -125.0], [70.5, -140.0], [70.0, -148.0], [71.0, -156.0],
            [68.5, -166.0], [65.0, -167.0], [60.0, -167.0], [56.0, -162.0], [54.5, -165.0],
            [58.0, -158.0], [60.0, -150.0], [59.5, -140.0], [56.0, -132.0], [54.0, -130.5],
            [50.0, -127.0], [48.5, -124.5], [45.0, -124.0], [40.0, -124.0], [36.0, -121.5],
            [34.0, -118.5], [32.5, -117.2], [31.8, -114.5], [31.5, -113.0], [29.0, -113.5],
            [26.5, -112.5], [24.0, -110.0], [22.8, -109.8], [25.0, -108.0], [23.0, -106.0],
            [20.0, -105.5], [17.5, -101.5], [16.0, -97.5], [15.5, -92.5], [14.5, -92.0],
            [13.5, -89.0], [13.0, -87.5], [11.0, -86.0], [9.5, -84.5], [8.5, -83.0],
            [8.0, -80.5], [9.0, -79.5], [9.5, -82.5], [12.0, -83.8], [14.0, -83.5],
            [15.5, -88.5], [18.0, -88.0], [18.5, -91.0], [18.5, -94.5], [21.0, -97.5],
            [25.5, -97.5], [28.0, -97.0], [29.5, -94.0], [29.8, -89.5], [30.0, -87.5],
            [29.5, -85.0], [28.0, -82.5], [25.5, -81.5], [24.5, -81.0], [25.2, -80.2],
            [27.0, -80.0], [30.5, -81.5], [33.5, -79.0], [35.5, -75.5], [38.0, -75.0],
            [40.5, -74.0], [41.5, -70.5], [42.5, -70.5], [44.0, -69.0], [45.0, -67.0],
            [46.5, -64.5], [47.0, -60.0], [47.5, -53.0], [50.0, -56.0],
          ],
        },
        {
          name: 'South America',
          points: [
            [12.2, -71.5], [11.0, -64.5], [10.5, -62.0], [8.0, -59.5], [6.0, -57.0],
            [5.0, -52.0], [2.0, -50.5], [-1.5, -48.5], [-4.0, -38.0], [-5.5, -35.2],
            [-8.0, -34.8], [-12.5, -37.5], [-16.0, -39.0], [-20.0, -40.0], [-23.0, -43.0],
            [-25.5, -48.0], [-29.0, -49.5], [-33.5, -53.0], [-36.0, -56.5], [-39.0, -59.0],
            [-41.0, -63.0], [-45.0, -65.5], [-48.0, -66.0], [-52.0, -68.5], [-54.8, -67.5],
            [-55.0, -68.5], [-54.5, -70.0], [-52.5, -73.5], [-50.0, -75.0], [-46.0, -74.5],
            [-42.0, -73.5], [-38.0, -73.5], [-33.0, -71.5], [-28.0, -71.0], [-23.0, -70.5],
            [-18.5, -70.5], [-15.0, -75.5], [-12.0, -77.2], [-8.0, -79.0], [-5.0, -81.0],
            [-2.0, -80.8], [0.5, -80.0], [2.5, -78.5], [6.0, -77.5], [8.5, -77.0],
            [10.5, -75.0], [11.5, -73.0], [12.2, -71.5],
          ],
        },
        {
          name: 'Australia',
          points: [
            [-14.0, 126.5], [-15.5, 124.0], [-17.5, 122.0], [-20.0, 119.0], [-22.0, 114.0],
            [-25.5, 113.5], [-28.0, 114.0], [-32.0, 115.5], [-34.5, 116.0], [-35.0, 118.0],
            [-33.5, 123.0], [-32.0, 128.0], [-31.5, 131.5], [-32.5, 134.0], [-34.5, 136.0],
            [-35.5, 138.5], [-38.0, 140.5], [-38.5, 143.0], [-39.0, 146.0], [-37.5, 149.5],
            [-35.0, 151.0], [-32.0, 152.5], [-28.5, 153.5], [-25.0, 153.0], [-22.0, 150.0],
            [-19.0, 147.0], [-16.0, 145.5], [-14.0, 144.0], [-12.0, 143.0], [-11.0, 142.2],
            [-12.5, 141.0], [-15.0, 136.0], [-14.5, 132.0], [-12.5, 130.5], [-12.0, 130.0],
            [-14.0, 126.5],
          ],
        },
        {
          name: 'Antarctica',
          points: [
            [-70.0, -180], [-68.0, -140], [-70.0, -100], [-72.0, -60], [-74.0, -40],
            [-70.0, 0], [-68.0, 40], [-70.0, 80], [-72.0, 120], [-70.0, 160],
            [-68.0, 180], [-70.0, -180],
          ],
        },
        {
          name: 'Greenland',
          points: [
            [83.5, -35.0], [82.0, -20.0], [78.0, -18.0], [74.0, -20.0], [70.0, -22.0],
            [68.0, -27.0], [65.0, -38.0], [61.0, -43.0], [60.0, -45.0], [63.0, -51.0],
            [67.0, -53.5], [70.5, -54.5], [74.0, -57.0], [77.0, -65.0], [79.5, -68.0],
            [81.5, -62.0], [83.0, -45.0], [83.5, -35.0],
          ],
        },

        // —— 中国岛屿 ——
        {
          name: 'Taiwan',
          points: [
            [25.3, 121.55], [25.1, 121.9], [24.8, 121.95], [24.3, 121.8],
            [23.8, 121.55], [23.2, 121.4], [22.7, 121.2], [22.2, 120.95],
            [21.9, 120.85], [22.1, 120.55], [22.5, 120.35], [23.0, 120.15],
            [23.5, 120.1], [24.0, 120.35], [24.5, 120.6], [24.9, 121.0],
            [25.2, 121.35], [25.3, 121.55],
          ],
        },
        {
          name: 'Hainan',
          points: [
            [20.15, 110.65], [20.05, 110.95], [19.7, 111.0], [19.2, 110.7],
            [18.5, 110.2], [18.2, 109.6], [18.35, 108.9], [18.8, 108.6],
            [19.3, 108.7], [19.8, 109.1], [20.05, 109.6], [20.15, 110.65],
          ],
        },

        // —— 东亚 / 东南亚岛屿 ——
        {
          name: 'Japan_Honshu',
          points: [
            [41.5, 140.5], [41.0, 141.5], [39.5, 142.0], [38.0, 141.0], [36.5, 140.8],
            [35.5, 140.0], [34.8, 139.8], [34.5, 138.0], [34.6, 136.5], [34.0, 135.0],
            [33.5, 134.0], [33.8, 132.5], [34.5, 131.5], [35.0, 132.5], [35.5, 134.0],
            [36.0, 136.0], [36.5, 137.0], [37.5, 138.5], [38.5, 139.5], [40.0, 140.0],
            [41.0, 140.2], [41.5, 140.5],
          ],
        },
        {
          name: 'Japan_Hokkaido',
          points: [
            [45.5, 141.5], [44.5, 143.5], [43.5, 145.5], [43.0, 145.0], [42.0, 143.0],
            [41.5, 140.5], [42.0, 139.8], [43.5, 140.0], [44.5, 141.5], [45.5, 141.5],
          ],
        },
        {
          name: 'Japan_Kyushu',
          points: [
            [33.8, 130.5], [33.5, 131.8], [32.5, 131.8], [31.5, 131.2], [31.2, 130.5],
            [31.5, 129.8], [32.5, 129.8], [33.2, 129.8], [33.8, 130.5],
          ],
        },
        {
          name: 'Philippines_Luzon',
          points: [
            [18.5, 120.8], [18.2, 122.2], [16.5, 122.2], [14.5, 121.5], [13.5, 123.5],
            [13.0, 124.0], [12.5, 121.5], [14.0, 120.5], [16.0, 119.8], [18.0, 120.5],
            [18.5, 120.8],
          ],
        },
        {
          name: 'Philippines_Mindanao',
          points: [
            [9.8, 125.5], [9.2, 126.5], [7.5, 126.5], [6.0, 125.5], [5.5, 124.5],
            [6.5, 123.5], [8.0, 123.5], [9.0, 124.5], [9.8, 125.5],
          ],
        },
        {
          name: 'Borneo',
          points: [
            [7.0, 117.0], [6.0, 118.5], [4.0, 119.0], [1.5, 119.0], [-1.0, 117.0],
            [-3.0, 116.0], [-4.0, 114.5], [-3.0, 111.0], [-1.0, 109.5], [1.5, 109.0],
            [3.5, 111.0], [5.0, 114.0], [6.5, 116.0], [7.0, 117.0],
          ],
        },
        {
          name: 'Sumatra',
          points: [
            [5.5, 95.5], [5.0, 97.5], [3.5, 99.0], [1.5, 101.0], [-1.0, 103.5],
            [-3.0, 105.5], [-5.5, 105.5], [-6.0, 104.5], [-4.0, 102.0], [-2.0, 100.0],
            [0.0, 98.0], [2.0, 96.5], [4.0, 95.5], [5.5, 95.5],
          ],
        },
        {
          name: 'Java',
          points: [
            [-6.0, 105.5], [-6.0, 108.0], [-6.5, 110.5], [-7.5, 112.5], [-8.5, 114.5],
            [-8.8, 114.5], [-8.5, 112.0], [-7.5, 109.0], [-7.0, 106.5], [-6.5, 105.2],
            [-6.0, 105.5],
          ],
        },
        {
          name: 'Sulawesi',
          points: [
            [1.5, 121.0], [1.0, 125.0], [0.0, 124.5], [-2.0, 121.5], [-4.0, 120.0],
            [-5.5, 120.0], [-5.0, 119.0], [-2.5, 119.0], [0.0, 119.5], [1.5, 121.0],
          ],
        },
        {
          name: 'NewGuinea',
          points: [
            [-1.0, 131.0], [-0.5, 135.0], [-2.0, 140.0], [-4.0, 144.0], [-6.0, 147.5],
            [-8.0, 148.0], [-10.0, 147.0], [-10.5, 142.0], [-9.0, 141.0], [-7.0, 138.0],
            [-5.0, 135.0], [-3.0, 132.5], [-1.5, 131.0], [-1.0, 131.0],
          ],
        },
        {
          name: 'SriLanka',
          points: [
            [9.8, 80.0], [9.0, 80.8], [7.5, 81.8], [6.0, 81.5], [5.9, 80.5],
            [6.5, 80.0], [8.0, 79.8], [9.5, 79.8], [9.8, 80.0],
          ],
        },

        // —— 大洋洲岛屿 ——
        {
          name: 'Tasmania',
          points: [
            [-40.7, 144.7], [-41.0, 148.2], [-42.5, 148.0], [-43.6, 146.9],
            [-43.5, 145.5], [-42.0, 145.0], [-40.7, 144.7],
          ],
        },
        {
          name: 'NewZealand_North',
          points: [
            [-34.5, 173.0], [-35.5, 174.5], [-36.5, 175.0], [-37.5, 178.0],
            [-39.0, 178.0], [-41.3, 175.0], [-41.0, 174.5], [-39.0, 174.0],
            [-37.5, 174.5], [-36.0, 174.0], [-34.5, 173.0],
          ],
        },
        {
          name: 'NewZealand_South',
          points: [
            [-40.6, 172.7], [-41.5, 174.0], [-43.0, 173.0], [-44.5, 171.0],
            [-46.5, 169.5], [-46.7, 168.0], [-45.0, 167.0], [-43.5, 168.5],
            [-42.0, 171.0], [-40.6, 172.7],
          ],
        },

        // —— 欧洲 / 大西洋岛屿 ——
        {
          name: 'UK',
          points: [
            [58.6, -5.0], [58.5, -3.0], [57.5, -2.0], [56.0, -2.2], [55.5, -1.5],
            [54.0, -0.5], [53.0, 0.2], [52.0, 1.5], [51.5, 1.4], [51.0, 1.0],
            [50.5, -1.0], [50.0, -5.5], [51.5, -5.0], [52.5, -4.5], [53.5, -4.5],
            [54.5, -5.0], [55.0, -5.5], [56.0, -6.0], [57.5, -6.0], [58.6, -5.0],
          ],
        },
        {
          name: 'Ireland',
          points: [
            [55.3, -7.3], [55.0, -6.0], [54.0, -5.5], [52.5, -6.0], [51.5, -9.5],
            [52.0, -10.2], [53.0, -10.0], [54.0, -10.0], [55.0, -8.5], [55.3, -7.3],
          ],
        },
        {
          name: 'Iceland',
          points: [
            [66.5, -23.0], [66.0, -15.0], [65.0, -13.5], [63.5, -16.0], [63.4, -20.0],
            [64.0, -22.5], [65.5, -24.0], [66.5, -23.0],
          ],
        },
        {
          name: 'Madagascar',
          points: [
            [-12.0, 49.3], [-14.0, 50.2], [-16.0, 50.0], [-19.0, 49.0], [-22.0, 48.0],
            [-25.0, 47.0], [-25.6, 45.2], [-23.5, 43.6], [-20.0, 44.0], [-16.0, 44.5],
            [-13.5, 47.5], [-12.0, 49.3],
          ],
        },
        {
          name: 'Cuba',
          points: [
            [23.2, -82.5], [23.0, -80.0], [22.0, -78.0], [21.0, -76.0], [20.0, -74.5],
            [19.8, -75.5], [20.5, -77.0], [21.5, -80.0], [22.0, -82.0], [22.5, -84.0],
            [23.0, -83.0], [23.2, -82.5],
          ],
        },
        {
          name: 'Sicily',
          points: [
            [38.3, 15.6], [38.0, 15.3], [37.0, 15.2], [36.7, 14.5], [37.2, 13.0],
            [38.0, 12.5], [38.3, 13.5], [38.3, 15.6],
          ],
        },
        {
          name: 'Sardinia',
          points: [
            [41.3, 9.5], [40.5, 9.7], [39.2, 9.5], [38.9, 8.5], [40.0, 8.2],
            [41.2, 8.2], [41.3, 9.5],
          ],
        },
      ];

      const borderPolygons = [
        {
          name: 'USA',
          points: [
            [49.0, -125.0], [42.5, -125.0], [40.0, -124.0], [34.5, -120.5],
            [32.7, -117.5], [31.5, -111.0], [31.5, -108.0], [32.0, -106.5],
            [29.0, -103.0], [27.5, -99.5], [26.0, -97.5], [29.5, -94.0],
            [30.0, -89.0], [29.0, -85.5], [24.5, -82.0], [25.0, -80.0],
            [32.0, -80.5], [36.5, -76.0], [40.5, -74.0], [42.5, -70.0],
            [45.0, -67.0], [47.5, -69.0], [45.0, -75.0], [45.5, -82.5],
            [48.0, -88.5], [49.0, -95.0], [49.0, -125.0],
          ],
        },
        {
          name: 'Canada',
          points: [
            [60.0, -140.5], [70.0, -140.5], [70.0, -130.0], [71.0, -110.0],
            [73.5, -95.0], [73.5, -78.0], [63.0, -70.0], [60.0, -63.0],
            [52.5, -57.0], [47.5, -53.0], [46.5, -60.0], [45.0, -67.0],
            [47.5, -69.0], [45.0, -75.0], [45.5, -82.5], [48.0, -88.5],
            [49.0, -95.0], [49.0, -123.0], [54.5, -132.0], [60.0, -140.5],
          ],
        },
        {
          name: 'China',
          points: [
            [48.5, 135.0], [45.0, 131.0], [42.5, 130.5], [40.0, 124.0], [38.5, 121.5],
            [37.0, 122.5], [35.0, 119.5], [32.0, 121.5], [30.0, 122.0], [28.0, 121.0],
            [25.5, 119.5], [24.5, 118.0], [23.0, 117.0], [22.5, 114.0], [21.8, 113.0],
            [21.5, 110.0], [21.0, 108.0], [22.0, 106.5], [22.5, 104.0], [22.5, 100.0],
            [24.0, 97.5], [28.0, 97.0], [29.0, 94.0], [28.5, 90.0], [27.5, 88.0],
            [28.5, 86.0], [30.5, 81.0], [35.0, 78.0], [39.0, 74.0], [42.0, 80.0],
            [45.0, 82.0], [47.5, 85.0], [48.0, 87.0], [46.5, 91.0], [45.0, 95.0],
            [42.5, 100.0], [42.0, 107.0], [43.5, 112.0], [45.0, 116.0], [48.0, 118.0],
            [50.0, 120.0], [51.5, 124.0], [50.0, 128.0], [48.5, 135.0],
          ],
        },
        {
          name: 'India',
          points: [
            [8.0, 77.5], [9.0, 79.0], [13.0, 80.5], [17.0, 81.5],
            [19.5, 84.5], [21.5, 87.0], [22.0, 89.0], [26.5, 89.5],
            [27.0, 88.0], [28.5, 80.0], [31.0, 78.5], [32.5, 75.0],
            [35.5, 77.0], [34.5, 74.0], [28.0, 69.5], [24.0, 68.0],
            [22.5, 70.0], [21.0, 71.5], [17.5, 72.5], [14.5, 74.0],
            [10.0, 76.0], [8.0, 77.5],
          ],
        },
        {
          name: 'Brazil',
          points: [
            [-5.5, -35.0], [-22.5, -40.0], [-25.5, -48.5], [-33.5, -53.5],
            [-30.5, -57.5], [-20.0, -58.0], [-16.5, -58.5], [-11.0, -62.5],
            [-11.0, -68.5], [-9.5, -70.5], [-7.5, -72.5], [-4.5, -73.5],
            [-4.0, -70.0], [-1.0, -69.5], [1.5, -67.0], [4.5, -61.5],
            [4.5, -59.5], [5.0, -52.0], [-1.0, -48.0], [-5.5, -35.0],
          ],
        },
      ];

      // 射线法判断点是否在多边形内（lat, lng 空间）
      const pointInPolygon = (lat: number, lng: number, polygon: number[][]) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const [yi, xi] = polygon[i];
          const [yj, xj] = polygon[j];
          const intersect = ((yi > lat) !== (yj > lat)) &&
            (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      };

      // 预计算陆地填充点：小岛用更密步长，避免漏填
      let landFillPoints: Array<{ lat: number; lng: number }> = [];
      const generateLandFillPoints = () => {
        const points: Array<{ lat: number; lng: number }> = [];

        coastlinePolygons.forEach(poly => {
          const lats = poly.points.map(p => p[0]);
          const lngs = poly.points.map(p => p[1]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const span = Math.max(maxLat - minLat, maxLng - minLng);
          const step = span < 6 ? 0.45 : span < 20 ? 1.0 : 2.2;
          const pad = Math.min(1.2, step);

          for (let lat = minLat - pad; lat <= maxLat + pad; lat += step) {
            for (let lng = minLng - pad; lng <= maxLng + pad; lng += step) {
              if (pointInPolygon(lat, lng, poly.points)) {
                points.push({ lat, lng });
              }
            }
          }
        });

        return points;
      };

      landFillPoints = generateLandFillPoints();

      // ====== 主绘制循环 ======
      let globeCx = 0;
      let globeCy = 0;
      let globeR = 0;

      const draw = () => {
        if (disposed) return;

        const width = canvas.width / 2;
        const height = canvas.height / 2;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(2, 2);

        // 地球参数 - 为左侧功能卖点区腾出空间，整体居中偏右
        globeCx = width * 0.58;
        globeCy = height * 0.52;
        globeR = Math.min(width, height) * 0.42;

        // 更新科技漂浮文字位置（必须在地球参数计算之后）
        updateFloatingTexts(frameCount);

        // ========================================
        // 第一层：长流星科技雨 + 粒子
        // ========================================
        meteors.forEach((meteor, index) => {
          meteor.y -= meteor.speed;
          meteor.x += Math.sin(meteor.y * 0.005 + meteor.phase) * 0.35 + meteor.drift;

          if (meteor.y < -meteor.length) {
            meteors[index] = createMeteor();
            meteors[index].y = height + 100;
            return;
          }

          // 长拖尾光线
          const tailX = meteor.x + Math.sin(meteor.phase) * 6;
          const tailY = meteor.y + meteor.length;
          const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
          gradient.addColorStop(0, `hsla(${meteor.hue}, 95%, 82%, ${meteor.opacity})`);
          gradient.addColorStop(0.2, `hsla(${meteor.hue}, 88%, 65%, ${meteor.opacity * 0.8})`);
          gradient.addColorStop(0.5, `hsla(${meteor.hue}, 78%, 52%, ${meteor.opacity * 0.35})`);
          gradient.addColorStop(0.8, `hsla(${meteor.hue}, 70%, 45%, ${meteor.opacity * 0.12})`);
          gradient.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(tailX, tailY);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = meteor.width;
          ctx.lineCap = 'round';
          ctx.stroke();

          // 流星头部
          const headGlow = ctx.createRadialGradient(
            meteor.x, meteor.y, 0,
            meteor.x, meteor.y, 7
          );
          headGlow.addColorStop(0, `hsla(${meteor.hue}, 100%, 90%, ${meteor.opacity * 3})`);
          headGlow.addColorStop(0.4, `hsla(${meteor.hue}, 90%, 70%, ${meteor.opacity * 1.5})`);
          headGlow.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(meteor.x, meteor.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = headGlow;
          ctx.fill();
        });

        // 科技粒子
        particles.forEach(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.y < -10) {
            particle.y = height + 10;
            particle.x = Math.random() * width;
          }
          if (particle.x < -10) particle.x = width + 10;
          if (particle.x > width + 10) particle.x = -10;

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${particle.hue}, 90%, 75%, ${particle.opacity})`;
          ctx.fill();
        });

        // ========================================
        // 第二层：3D旋转科技地球
        // ========================================

        // 极淡外层光晕（不要大面积发光，仅作为空间氛围）
        const outerGlow = ctx.createRadialGradient(
          globeCx, globeCy, globeR * 0.92,
          globeCx, globeCy, globeR * 1.06
        );
        outerGlow.addColorStop(0, 'rgba(59, 130, 246, 0.03)');
        outerGlow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(globeCx, globeCy, globeR * 1.06, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // 地球主体 - 深色科技球体，强3D立体感
        const earthGradient = ctx.createRadialGradient(
          globeCx - globeR * 0.42, globeCy - globeR * 0.42, 0,
          globeCx, globeCy, globeR
        );
        earthGradient.addColorStop(0, '#1a3a5c');
        earthGradient.addColorStop(0.15, '#0f2944');
        earthGradient.addColorStop(0.35, '#081c30');
        earthGradient.addColorStop(0.6, '#051320');
        earthGradient.addColorStop(0.82, '#030f1a');
        earthGradient.addColorStop(0.95, '#051627');
        earthGradient.addColorStop(1, 'rgba(10, 28, 50, 0.85)');

        ctx.beginPath();
        ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
        ctx.fillStyle = earthGradient;
        ctx.fill();

        // 地球边缘柔和过渡层（消除深色边界，柔化与背景的衔接）
        ctx.beginPath();
        ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
        const edgeSoftener = ctx.createRadialGradient(
          globeCx, globeCy, globeR * 0.78,
          globeCx, globeCy, globeR * 1.02
        );
        edgeSoftener.addColorStop(0, 'transparent');
        edgeSoftener.addColorStop(0.88, 'rgba(59, 130, 246, 0.06)');
        edgeSoftener.addColorStop(0.96, 'rgba(96, 165, 250, 0.16)');
        edgeSoftener.addColorStop(1, 'transparent');
        ctx.fillStyle = edgeSoftener;
        ctx.fill();

        // 地图仪科技支架 - 赤道环 + 子午环 + 底部基座
        ctx.save();

        // 赤道环
        ctx.beginPath();
        ctx.ellipse(globeCx, globeCy, globeR * 1.18, globeR * 0.32, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.22)';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = 'rgba(96, 165, 250, 0.45)';
        ctx.shadowBlur = 22;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 子午环
        ctx.beginPath();
        ctx.ellipse(globeCx, globeCy, globeR * 0.35, globeR * 1.18, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.18)';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = 'rgba(96, 165, 250, 0.4)';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 底部基座弧线
        ctx.beginPath();
        ctx.ellipse(globeCx, globeCy + globeR * 1.12, globeR * 0.55, globeR * 0.12, 0, Math.PI, 0);
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.32)';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(96, 165, 250, 0.5)';
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 支架节点高光
        const standNodes = [
          { x: globeCx - globeR * 1.18, y: globeCy },
          { x: globeCx + globeR * 1.18, y: globeCy },
          { x: globeCx, y: globeCy - globeR * 1.18 },
        ];
        standNodes.forEach(node => {
          const nodeGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 8);
          nodeGlow.addColorStop(0, 'rgba(165, 243, 252, 0.6)');
          nodeGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
          nodeGlow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = nodeGlow;
          ctx.fill();
        });

        ctx.restore();

        // 经纬网格 - 多层精细网格
        ctx.lineWidth = 0.5;

        // 纬线
        for (let lat = -75; lat <= 75; lat += 12) {
          const latRad = (lat * Math.PI) / 180;
          const y = globeCy - globeR * Math.sin(latRad) * 0.82;
          const radiusAtLat = globeR * Math.cos(latRad);

          ctx.beginPath();
          ctx.ellipse(globeCx, y, radiusAtLat, radiusAtLat * 0.1, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.06)';
          ctx.stroke();
        }

        // 经线
        for (let lng = 0; lng < 360; lng += 10) {
          const lngRad = ((lng + rotation * 57.3) * Math.PI) / 180;
          const visible = Math.cos(lngRad);

          if (Math.abs(visible) > 0.08) {
            ctx.beginPath();
            ctx.ellipse(
              globeCx, globeCy,
              Math.abs(globeR * Math.sin(lngRad)), globeR * 0.82,
              0, 0, Math.PI * 2
            );
            ctx.globalAlpha = Math.abs(visible) * 0.5;
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.07 + Math.abs(visible) * 0.1})`;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // 真实地理大陆填充（预计算点云）
        landFillPoints.forEach((point, i) => {
          const pos = latLngTo3D(point.lat, point.lng, globeR * 0.97);
          if (pos.z < -globeR * 0.12) return;

          const projected = project3D(pos.x, pos.y, pos.z);
          const depthAlpha = 0.3 + 0.55 * ((pos.z + globeR) / (2 * globeR));

          ctx.save();
          ctx.shadowColor = 'rgba(96, 165, 250, 0.35)';
          ctx.shadowBlur = 6;

          ctx.beginPath();
          ctx.arc(projected.x, projected.y, 3.0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(96, 165, 250, ${0.65 * depthAlpha})`;
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.restore();

          ctx.beginPath();
          ctx.arc(projected.x, projected.y, 1.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(165, 243, 252, ${0.6 * depthAlpha})`;
          ctx.fill();
        });

        // 大陆海岸线（明亮边界）- 按线段绘制，避免穿到背面
        ctx.lineWidth = 1.2;
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(96, 165, 250, 0.65)';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.75)';

        coastlinePolygons.forEach(poly => {
          for (let i = 0; i < poly.points.length; i++) {
            const nextIdx = (i + 1) % poly.points.length;
            const [lat1, lng1] = poly.points[i];
            const [lat2, lng2] = poly.points[nextIdx];
            const pos1 = latLngTo3D(lat1, lng1, globeR * 0.98);
            const pos2 = latLngTo3D(lat2, lng2, globeR * 0.98);

            if (pos1.z < -globeR * 0.05 || pos2.z < -globeR * 0.05) continue;

            const p1 = project3D(pos1.x, pos1.y, pos1.z);
            const p2 = project3D(pos2.x, pos2.y, pos2.z);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
        ctx.shadowBlur = 0;

        // 国界线（略暗）
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
        ctx.setLineDash([2, 3]);
        borderPolygons.forEach(poly => {
          for (let i = 0; i < poly.points.length; i++) {
            const nextIdx = (i + 1) % poly.points.length;
            const [lat1, lng1] = poly.points[i];
            const [lat2, lng2] = poly.points[nextIdx];
            const pos1 = latLngTo3D(lat1, lng1, globeR * 0.985);
            const pos2 = latLngTo3D(lat2, lng2, globeR * 0.985);

            if (pos1.z < -globeR * 0.05 || pos2.z < -globeR * 0.05) continue;

            const p1 = project3D(pos1.x, pos1.y, pos1.z);
            const p2 = project3D(pos2.x, pos2.y, pos2.z);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
        ctx.setLineDash([]);

        // 大陆 / 海洋 / 首都名称标签
        const globeLabels = [
          // 大陆
          { lat: 38, lng: 95, text: '亚洲', type: 'continent' },
          { lat: 52, lng: 18, text: '欧洲', type: 'continent' },
          { lat: 8, lng: 20, text: '非洲', type: 'continent' },
          { lat: 45, lng: -100, text: '北美洲', type: 'continent' },
          { lat: -15, lng: -60, text: '南美洲', type: 'continent' },
          { lat: -25, lng: 135, text: '大洋洲', type: 'continent' },
          // 海洋
          { lat: 15, lng: 165, text: '太平洋', type: 'ocean' },
          { lat: -20, lng: -25, text: '大西洋', type: 'ocean' },
          { lat: -15, lng: 75, text: '印度洋', type: 'ocean' },
          { lat: 75, lng: 0, text: '北冰洋', type: 'ocean' },
          // 首都
          { lat: 39.9, lng: 116.4, text: '北京', type: 'capital' },
          { lat: 35.7, lng: 139.7, text: '东京', type: 'capital' },
          { lat: 28.6, lng: 77.2, text: '新德里', type: 'capital' },
          { lat: 55.8, lng: 37.6, text: '莫斯科', type: 'capital' },
          { lat: 51.5, lng: -0.1, text: '伦敦', type: 'capital' },
          { lat: 48.9, lng: 2.3, text: '巴黎', type: 'capital' },
          { lat: 52.5, lng: 13.4, text: '柏林', type: 'capital' },
          { lat: 41.9, lng: 12.5, text: '罗马', type: 'capital' },
          { lat: 30.0, lng: 31.2, text: '开罗', type: 'capital' },
          { lat: 38.9, lng: -77.0, text: '华盛顿', type: 'capital' },
          { lat: 45.4, lng: -75.7, text: '渥太华', type: 'capital' },
          { lat: 19.4, lng: -99.1, text: '墨西哥城', type: 'capital' },
          { lat: -15.8, lng: -47.9, text: '巴西利亚', type: 'capital' },
          { lat: -34.6, lng: -58.4, text: '布宜诺斯艾利斯', type: 'capital' },
          { lat: -35.3, lng: 149.1, text: '堪培拉', type: 'capital' },
        ];

        globeLabels.forEach(label => {
          // latLngTo3D 内部已扣除 rotation，勿再叠加，否则标签会停在屏幕固定位置
          const pos = latLngTo3D(label.lat, label.lng, globeR * 1.05);
          if (pos.z < -globeR * 0.1) return;

          const projected = project3D(pos.x, pos.y, pos.z);
          const depthAlpha = 0.35 + 0.5 * ((pos.z + globeR) / (2 * globeR));

          const style =
            label.type === 'continent'
              ? { font: '600 13px "SF Pro Display", -apple-system, "PingFang SC", sans-serif', textColor: 'rgba(165, 243, 252, 0.88)', borderAlpha: 0.45, bgAlpha: 0.72 }
              : label.type === 'ocean'
              ? { font: '500 11px "SF Pro Display", -apple-system, "PingFang SC", sans-serif', textColor: 'rgba(96, 165, 250, 0.6)', borderAlpha: 0.25, bgAlpha: 0.45 }
              : { font: '500 10px "SF Pro Display", -apple-system, "PingFang SC", sans-serif', textColor: 'rgba(203, 213, 225, 0.78)', borderAlpha: 0.32, bgAlpha: 0.6 };

          ctx.font = style.font;
          const textWidth = ctx.measureText(label.text).width + 14;
          const labelH = label.type === 'continent' ? 24 : label.type === 'ocean' ? 20 : 18;
          const labelX = projected.x - textWidth / 2;
          const labelY = projected.y - labelH / 2;

          // 标签背景
          ctx.fillStyle = `rgba(2, 6, 18, ${style.bgAlpha * depthAlpha})`;
          ctx.beginPath();
          ctx.roundRect(labelX, labelY, textWidth, labelH, 5);
          ctx.fill();

          // 标签边框
          ctx.strokeStyle = `rgba(96, 165, 250, ${style.borderAlpha * depthAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          // 文字
          ctx.fillStyle = style.textColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label.text, projected.x, projected.y + 0.5);

          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        });

        // ========================================
        // 第三层：三个全球重要地点
        // ========================================
        const locPositions = locations.map(loc => {
          const pos3D = latLngTo3D(loc.lat, loc.lng, globeR * 0.95);
          const projected = project3D(pos3D.x, pos3D.y, pos3D.z);
          return {
            x: projected.x,
            y: projected.y,
            z: pos3D.z,
            raw3D: pos3D,
            visible: pos3D.z > -globeR * 0.45,
            ...loc,
          };
        });

        // 绘制地点连接线（3D空间弧线）
        for (let i = 0; i < locPositions.length; i++) {
          for (let j = i + 1; j < locPositions.length; j++) {
            const p1 = locPositions[i];
            const p2 = locPositions[j];

            if (!p1.visible || !p2.visible) continue;

            const arc = draw3DArc(p1.raw3D, p2.raw3D, '#60a5fa', 0.65);
            if (!arc) continue;

            // 数据流粒子沿弧线运动
            const flowT = ((Date.now() / 2600) + i * 0.33 + j * 0.17) % 1;
            const fx = Math.pow(1 - flowT, 2) * arc.pp1.x + 2 * (1 - flowT) * flowT * arc.pp2.x + flowT * flowT * arc.pp3.x;
            const fy = Math.pow(1 - flowT, 2) * arc.pp1.y + 2 * (1 - flowT) * flowT * arc.pp2.y + flowT * flowT * arc.pp3.y;

            // 粒子拖尾
            for (let k = 6; k >= 0; k--) {
              const trailT = Math.max(0, flowT - k * 0.015);
              const tx = Math.pow(1 - trailT, 2) * arc.pp1.x + 2 * (1 - trailT) * trailT * arc.pp2.x + trailT * trailT * arc.pp3.x;
              const ty = Math.pow(1 - trailT, 2) * arc.pp1.y + 2 * (1 - trailT) * trailT * arc.pp2.y + trailT * trailT * arc.pp3.y;

              ctx.beginPath();
              ctx.arc(tx, ty, 3 - k * 0.35, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(165, 243, 252, ${0.2 - k * 0.03})`;
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
            const pointGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 8);
            pointGlow.addColorStop(0, 'rgba(165, 243, 252, 0.9)');
            pointGlow.addColorStop(0.5, 'rgba(34, 211, 238, 0.4)');
            pointGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = pointGlow;
            ctx.fill();
          }
        }

        // 绘制地点标记
        locPositions.forEach((loc, locIndex) => {
          if (!loc.visible) return;

          // 脉冲扩散
          const pulsePhase = ((Date.now() + locIndex * 1000) % 3000) / 3000;
          const pulseRadius = 10 + pulsePhase * 32;
          const pulseOpacity = 0.35 - pulsePhase * 0.35;

          ctx.beginPath();
          ctx.arc(loc.x, loc.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${hexToRgb(loc.color)}, ${pulseOpacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // 定位点核心光晕
          const coreGlow = ctx.createRadialGradient(loc.x, loc.y, 0, loc.x, loc.y, 18);
          coreGlow.addColorStop(0, `rgba(${hexToRgb(loc.color)}, 0.75)`);
          coreGlow.addColorStop(0.45, `rgba(${hexToRgb(loc.color)}, 0.28)`);
          coreGlow.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(loc.x, loc.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = coreGlow;
          ctx.fill();

          // 科技环
          ctx.beginPath();
          ctx.arc(loc.x, loc.y, 7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${hexToRgb(loc.color)}, 0.5)`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // 定位点实心圆
          ctx.beginPath();
          ctx.arc(loc.x, loc.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = loc.color;
          ctx.fill();

          // 白色内芯
          ctx.beginPath();
          ctx.arc(loc.x, loc.y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // 标签
          ctx.font = '600 18px "SF Pro Display", -apple-system, "PingFang SC", sans-serif';
          const textWidth = ctx.measureText(loc.name).width + 32;
          const labelY = loc.y - 52;

          // 标签背景
          ctx.fillStyle = 'rgba(2, 6, 18, 0.92)';
          ctx.beginPath();
          ctx.roundRect(loc.x - textWidth / 2, labelY - 18, textWidth, 36, 7);
          ctx.fill();

          // 标签边框
          ctx.strokeStyle = `rgba(${hexToRgb(loc.color)}, 0.45)`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // 名称
          ctx.fillStyle = '#e2e8f0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(loc.name, loc.x, labelY);

          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        });

        // 缓慢自转（约26秒一圈，持续稳定转动）
        rotation += 0.004;

        ctx.restore();
        frameCount++;
        animationId = requestAnimationFrame(draw);
      };

      // 辅助函数：hex转rgb
      function hexToRgb(hex: string): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
          : '96, 165, 250';
      }

      // 启动动画循环
      animationId = requestAnimationFrame(draw);
    }, 150);

    return () => {
      disposed = true;
      clearTimeout(initTimer);
      clearTimeout(floatingInitTimer);
      cancelAnimationFrame(animationId);
      if (setCanvasSize) {
        window.removeEventListener('resize', setCanvasSize);
      }
    };
  }, []);

  // 绑定漂浮科技文字ref的辅助函数
  const setTextRef = (index: number) => (el: HTMLDivElement | null) => {
    textRefs.current[index] = el;
  };

  // ========== 渲染页面 ==========
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#020617' }}>
      {/* ====== 左侧：3D地球 + 全球网络 + 科技流星雨 (65%) ====== */}
      <div className="absolute top-0 left-0 w-[65%] h-screen">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ zIndex: 1 }}
        />

        {/* 左侧功能卖点区（参考图） */}
        <div
          className="absolute top-0 left-0 h-full flex flex-col justify-center pl-10"
          style={{ zIndex: 5 }}
        >
          <div className="relative">
            {/* 垂直科技线 */}
            <div
              className="absolute left-[27px] top-[42px] bottom-[42px] w-[1px]"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(96, 165, 250, 0.25) 20%, rgba(96, 165, 250, 0.35) 50%, rgba(96, 165, 250, 0.25) 80%, transparent 100%)',
              }}
            />

            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                ),
                title: '懂数智',
                desc: '洞察数据价值',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-4 4 4 6-6" />
                  </svg>
                ),
                title: '会分析',
                desc: '挖掘深层关联',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
                title: '能预警',
                desc: '识别风险隐患',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2v2" />
                    <path d="M12 12l4-2" />
                    <circle cx="12" cy="9" r="5" />
                  </svg>
                ),
                title: '给建议',
                desc: '驱动质量决策',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center mb-11 relative">
                {/* 发光节点 */}
                <div
                  className="absolute left-[27px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #a5f3fc 0%, #60a5fa 60%, transparent 100%)',
                    boxShadow: '0 0 10px rgba(165, 243, 252, 0.8), 0 0 24px rgba(96, 165, 250, 0.5)',
                  }}
                />

                {/* 图标圆环 */}
                <div
                  className="relative w-[54px] h-[54px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(2, 6, 23, 0.55)',
                    border: '1px solid rgba(96, 165, 250, 0.35)',
                    boxShadow: '0 0 20px rgba(96, 165, 250, 0.15), inset 0 0 14px rgba(96, 165, 250, 0.08)',
                    color: '#a5f3fc',
                  }}
                >
                  {item.icon}
                </div>

                {/* 文字 */}
                <div className="ml-5">
                  <div
                    className="font-bold tracking-[4px]"
                    style={{
                      fontSize: '26px',
                      color: 'rgba(255, 255, 255, 0.95)',
                      textShadow: '0 0 22px rgba(96, 165, 250, 0.35)',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    className="mt-1"
                    style={{
                      fontSize: '13px',
                      letterSpacing: '2px',
                      color: 'rgba(148, 163, 184, 0.75)',
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 左下角品牌标语 */}
        <div className="absolute bottom-10 left-10 flex items-center" style={{ zIndex: 5 }}>
          <div
            className="h-[1px] w-16 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(96, 165, 250, 0.65) 100%)' }}
          />
          <p
            className="mx-4 font-medium"
            style={{
              fontSize: '18px',
              letterSpacing: '5px',
              color: 'rgba(165, 243, 252, 0.92)',
              textShadow: '0 0 24px rgba(96, 165, 250, 0.45), 0 0 48px rgba(96, 165, 250, 0.15)',
            }}
          >
            AI驱动 · 全球协同 · 智能管控 · 质赢未来
          </p>
          <div
            className="h-[1px] w-16 rounded-full"
            style={{ background: 'linear-gradient(90deg, rgba(96, 165, 250, 0.65) 0%, transparent 100%)' }}
          />
        </div>
      </div>

      {/* ====== 右侧边缘漂浮科技文字（避开左侧功能卖点区） ====== */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 6 }}
      >
        <div
          ref={setTextRef(0)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '10%',
            left: '90%',
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '8px',
            color: 'rgba(165, 243, 252, 0.16)',
            textShadow: '0 0 28px rgba(165, 243, 252, 0.28)',
          }}
        >
          决策
        </div>

        <div
          ref={setTextRef(1)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '30%',
            left: '93%',
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '7px',
            color: 'rgba(34, 211, 238, 0.15)',
            textShadow: '0 0 28px rgba(34, 211, 238, 0.26)',
          }}
        >
          洞察
        </div>

        <div
          ref={setTextRef(2)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '56%',
            left: '91%',
            fontSize: '25px',
            fontWeight: 700,
            letterSpacing: '7px',
            color: 'rgba(96, 165, 250, 0.17)',
            textShadow: '0 0 30px rgba(96, 165, 250, 0.3)',
          }}
        >
          引擎
        </div>

        <div
          ref={setTextRef(3)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '82%',
            left: '92%',
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '6px',
            color: 'rgba(96, 165, 250, 0.15)',
            textShadow: '0 0 24px rgba(96, 165, 250, 0.24)',
          }}
        >
          融合
        </div>
      </div>

      {/* ====== 右侧：高端科技感登录框区 (35%) ====== */}
      <div className="relative min-h-screen ml-[65%] flex items-center justify-center px-10" style={{ zIndex: 10 }}>
        <div className="w-full max-w-[360px]">
          {/* ====== 科技感玻璃态登录卡片 ====== */}
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background: 'rgba(2, 6, 23, 0.72)',
              border: '1px solid rgba(59, 130, 246, 0.18)',
              backdropFilter: 'blur(24px)',
              boxShadow: `
                0 0 80px rgba(37, 99, 235, 0.12),
                0 20px 60px rgba(37, 99, 235, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.04),
                0 0 0 1px rgba(96, 165, 250, 0.08)
              `,
            }}
          >
            {/* 顶部高光 */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(96, 165, 250, 0.25) 40%, rgba(165, 243, 252, 0.4) 50%, rgba(96, 165, 250, 0.25) 60%, transparent 100%)',
              }}
            />

            {/* 悬浮立体感装饰 */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.03) 0%, transparent 70%)',
              }}
            />

            {/* 平台名称与标识 */}
            <div className="text-center mb-8">
              <h1
                className="tracking-[3px]"
                style={{
                  fontSize: '42px',
                  fontWeight: 800,
                  background: 'linear-gradient(180deg, #ffffff 0%, #a5f3fc 40%, #7dd3fc 60%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 16px rgba(96, 165, 250, 0.3)) drop-shadow(0 0 32px rgba(96, 165, 250, 0.1))',
                  marginBottom: '8px',
                }}
              >
                智 · 质
              </h1>

              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 400,
                  letterSpacing: '2px',
                  color: 'rgba(165, 243, 252, 0.55)',
                }}
              >
                AI数智化质量管控智能体
              </p>

              {/* 标题下方科技分隔线 */}
              <div className="relative mt-5 mx-auto" style={{ width: '100%' }}>
                <div
                  className="h-[1px]"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 20%, rgba(96, 165, 250, 0.35) 50%, rgba(59, 130, 246, 0.1) 80%, transparent 100%)',
                  }}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #a5f3fc 0%, #60a5fa 50%, transparent 70%)',
                    boxShadow: '0 0 10px rgba(165, 243, 252, 0.6), 0 0 20px rgba(96, 165, 250, 0.3)',
                  }}
                />
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              {/* 用户名输入框 */}
              <div
                className="flex items-center rounded-xl px-4 py-3 transition-all duration-300"
                style={{
                  background: 'rgba(15, 23, 42, 0.42)',
                  border: `1px solid ${
                    isFocused === 'username'
                      ? 'rgba(165, 243, 252, 0.65)'
                      : 'rgba(96, 165, 250, 0.28)'
                  }`,
                  boxShadow: isFocused === 'username'
                    ? '0 0 22px rgba(96, 165, 250, 0.22), inset 0 0 14px rgba(165, 243, 252, 0.08)'
                    : 'inset 0 1px 2px rgba(96, 165, 250, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.25)',
                }}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={isFocused === 'username' ? '#60a5fa' : '#94a3b8'} strokeWidth="1.5" style={{ transition: 'stroke 0.3s ease' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  placeholder="用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsFocused('username')}
                  onBlur={() => setIsFocused(null)}
                  className="flex-1 outline-none text-sm text-slate-200 placeholder-slate-400"
                  style={{
                    background: 'transparent',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                  autoComplete="off"
                />
              </div>

              {/* 密码输入框 */}
              <div
                className="flex items-center rounded-xl px-4 py-3 transition-all duration-300"
                style={{
                  background: 'rgba(15, 23, 42, 0.42)',
                  border: `1px solid ${
                    isFocused === 'password'
                      ? 'rgba(165, 243, 252, 0.65)'
                      : 'rgba(96, 165, 250, 0.28)'
                  }`,
                  boxShadow: isFocused === 'password'
                    ? '0 0 22px rgba(96, 165, 250, 0.22), inset 0 0 14px rgba(165, 243, 252, 0.08)'
                    : 'inset 0 1px 2px rgba(96, 165, 250, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.25)',
                }}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={isFocused === 'password' ? '#60a5fa' : '#94a3b8'} strokeWidth="1.5" style={{ transition: 'stroke 0.3s ease' }}>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                  className="flex-1 outline-none text-sm text-slate-200 placeholder-slate-400"
                  style={{
                    background: 'transparent',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 transition-colors duration-300"
                  style={{ color: showPassword ? '#60a5fa' : '#475569' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {showPassword ? (
                      <>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M4 4l16 16" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="text-red-400 text-xs text-center py-2 animate-pulse bg-red-500/10 rounded-lg">
                  {error}
                </div>
              )}

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group mt-6"
                style={{
                  background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                  boxShadow: isLoading
                    ? 'none'
                    : '0 4px 20px rgba(37, 99, 235, 0.28), 0 0 0 1px rgba(96, 165, 250, 0.2)',
                  letterSpacing: '4px',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    验证中...
                  </span>
                ) : (
                  <span>登 录</span>
                )}

                {/* 按钮扫光动画 */}
                {!isLoading && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                      transform: 'translateX(-100%)',
                      animation: 'btnSweep 2.5s ease-in-out infinite',
                    }}
                  />
                )}
              </button>

              {/* 底部选项 */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-blue-500 focus:ring-blue-500/30 bg-transparent cursor-pointer"
                  />
                  <span className="ml-2 text-xs tracking-wide" style={{ color: 'rgba(100, 116, 139, 0.75)' }}>
                    记住密码
                  </span>
                </label>

                <button
                  type="button"
                  className="text-xs tracking-wide transition-colors hover:text-blue-400"
                  style={{ color: 'rgba(100, 116, 139, 0.75)' }}
                >
                  忘记密码？
                </button>
              </div>
            </form>

          </div>

          {/* 底部版权信息 */}
          <p className="text-center text-xs tracking-wide mt-6" style={{ color: 'rgba(51, 65, 85, 0.4)' }}>
            © 2026 智 · 质 AI Quality Intelligence Platform
          </p>
        </div>
      </div>

      {/* 全局CSS动画定义 */}
      <style>{`
        @keyframes btnSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .tech-text-float {
          position: absolute;
          will-change: transform, left, top;
          transition: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
