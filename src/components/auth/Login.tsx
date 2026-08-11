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

  // ========== 使用演示账号 ==========
  const useDemoAccount = () => {
    setUsername('chenyu');
    setPassword('chenyu312');
    setError('');
  };

  // ========== 完整Canvas动画系统 ==========
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 延迟初始化确保DOM已加载
    const initTimer = setTimeout(() => {
      // 设置画布尺寸（高分辨率支持Retina屏）
      const setCanvasSize = () => {
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
      let animationId: number;
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

      // 初始百分比位置（相对于整个页面）与基础速度分组
      // 位置经过计算，确保均在地球安全区外，并尽量分散覆盖页面
      const textConfigs = [
        // 左侧组：数智·质控·智能·中枢
        { top: 0.12, left: 0.06, speed: 0.15, group: 'left' },
        { top: 0.38, left: 0.10, speed: 0.13, group: 'left' },
        { top: 0.66, left: 0.05, speed: 0.14, group: 'left' },
        { top: 0.88, left: 0.14, speed: 0.12, group: 'left' },
        // 右侧组：决策、洞察、引擎、融合
        { top: 0.10, left: 0.86, speed: 0.16, group: 'right' },
        { top: 0.32, left: 0.89, speed: 0.14, group: 'right' },
        { top: 0.60, left: 0.88, speed: 0.15, group: 'right' },
        { top: 0.86, left: 0.87, speed: 0.13, group: 'right' },
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
      const floatingInitTimer = setTimeout(initFloatingTexts, 200);

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
          lng: 140.0,
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

        // 光晕
        ctx.beginPath();
        ctx.moveTo(pp1.x, pp1.y);
        ctx.quadraticCurveTo(pp2.x, pp2.y, pp3.x, pp3.y);
        ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${alpha * 0.12})`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // 主线
        ctx.beginPath();
        ctx.moveTo(pp1.x, pp1.y);
        ctx.quadraticCurveTo(pp2.x, pp2.y, pp3.x, pp3.y);
        ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${alpha * 0.35})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        return { pp1, pp2, pp3 };
      };

      // ====== 主绘制循环 ======
      let globeCx = 0;
      let globeCy = 0;
      let globeR = 0;

      const draw = () => {
        const width = canvas.width / 2;
        const height = canvas.height / 2;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(2, 2);

        // 地球参数 - 保持当前大小，整体向右轻微移动
        globeCx = width * 0.48; // 整体向右偏移（之前0.42）
        globeCy = height * 0.52;
        globeR = Math.min(width, height) * 0.46; // 保持当前大小不变

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
        earthGradient.addColorStop(0, '#1e4878');
        earthGradient.addColorStop(0.15, '#14355a');
        earthGradient.addColorStop(0.35, '#0c2440');
        earthGradient.addColorStop(0.6, '#07182c');
        earthGradient.addColorStop(0.82, '#061626');
        earthGradient.addColorStop(0.95, '#0a1e36');
        earthGradient.addColorStop(1, 'rgba(13, 36, 65, 0.85)');

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

        // 经纬网格 - 多层精细网格
        ctx.lineWidth = 0.5;

        // 纬线
        for (let lat = -75; lat <= 75; lat += 12) {
          const latRad = (lat * Math.PI) / 180;
          const y = globeCy - globeR * Math.sin(latRad) * 0.82;
          const radiusAtLat = globeR * Math.cos(latRad);

          ctx.beginPath();
          ctx.ellipse(globeCx, y, radiusAtLat, radiusAtLat * 0.1, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.09)';
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

        // 科技数据节点 - 模拟城市/区域光点
        const nodeCount = 50;
        for (let i = 0; i < nodeCount; i++) {
          const nodeLat = (Math.random() * 160 - 80) * 0.75;
          const nodeLng = (i / nodeCount) * 360 + rotation * 57.3 + Math.random() * 25;
          const nodePos = latLngTo3D(nodeLat, nodeLng, globeR * 0.96);

          if (nodePos.z < -globeR * 0.2) continue;

          const projected = project3D(nodePos.x, nodePos.y, nodePos.z);
          const pulse = (Math.sin(Date.now() * 0.0025 + i * 1.3) + 1) / 2;

          ctx.beginPath();
          ctx.arc(projected.x, projected.y, 0.7 + pulse * 1.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(165, 243, 252, ${0.12 + pulse * 0.18})`;
          ctx.fill();
        }

        // 主要大陆轮廓科技线（简化版，增强科技感）
        const continentLines = [
          // 亚洲东部轮廓
          { lat: 50, lng: 120 }, { lat: 40, lng: 130 }, { lat: 30, lng: 120 },
          { lat: 20, lng: 110 }, { lat: 10, lng: 105 }, { lat: 0, lng: 100 },
          // 中东
          { lat: 30, lng: 60 }, { lat: 25, lng: 55 }, { lat: 20, lng: 50 },
          // 东南亚/印尼
          { lat: 0, lng: 110 }, { lat: -5, lng: 120 }, { lat: -8, lng: 115 },
          { lat: -5, lng: 140 }, { lat: 0, lng: 130 },
        ];

        ctx.beginPath();
        let firstPoint = true;
        continentLines.forEach((point, idx) => {
          const pos = latLngTo3D(point.lat, point.lng, globeR * 0.97);
          if (pos.z < -globeR * 0.2) {
            firstPoint = true;
            return;
          }
          const projected = project3D(pos.x, pos.y, pos.z);
          if (firstPoint) {
            ctx.moveTo(projected.x, projected.y);
            firstPoint = false;
          } else {
            const prev = continentLines[idx - 1];
            const prevPos = latLngTo3D(prev.lat, prev.lng, globeR * 0.97);
            const dist = Math.sqrt(
              Math.pow(pos.x - prevPos.x, 2) +
              Math.pow(pos.y - prevPos.y, 2) +
              Math.pow(pos.z - prevPos.z, 2)
            );
            if (dist < globeR * 0.5) {
              ctx.lineTo(projected.x, projected.y);
            } else {
              ctx.moveTo(projected.x, projected.y);
            }
          }
        });
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

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

        // 缓慢自转（约42秒一圈，持续稳定转动）
        rotation += 0.0024;

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

      // 清理函数
      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', setCanvasSize);
        clearTimeout(floatingInitTimer);
      };
    }, 150);

    return () => clearTimeout(initTimer);
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

        {/* 左下角品牌标识 */}
        <div className="absolute bottom-10 left-10 space-y-1.5" style={{ zIndex: 5 }}>
          <p className="text-xs tracking-[3px] font-medium" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
            GLOBAL DIGITAL MANUFACTURING
          </p>
          <p className="text-xs tracking-wider" style={{ color: 'rgba(71, 85, 105, 0.45)' }}>
            全球数字化智能制造平台
          </p>
        </div>
      </div>

      {/* ====== 全屏漂浮科技文字层（避开地球，低于登录框） ====== */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 6 }}
      >
        {/* 左侧组：数智·质控·智能·中枢 */}
        <div
          ref={setTextRef(0)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '12%',
            left: '6%',
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '10px',
            color: 'rgba(165, 243, 252, 0.22)',
            textShadow: '0 0 35px rgba(165, 243, 252, 0.38)',
          }}
        >
          数智
        </div>

        <div
          ref={setTextRef(1)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '38%',
            left: '10%',
            fontSize: '27px',
            fontWeight: 600,
            letterSpacing: '8px',
            color: 'rgba(96, 165, 250, 0.18)',
            textShadow: '0 0 28px rgba(96, 165, 250, 0.32)',
          }}
        >
          质控
        </div>

        <div
          ref={setTextRef(2)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '66%',
            left: '5%',
            fontSize: '30px',
            fontWeight: 700,
            letterSpacing: '9px',
            color: 'rgba(34, 211, 238, 0.2)',
            textShadow: '0 0 32px rgba(34, 211, 238, 0.35)',
          }}
        >
          智能
        </div>

        <div
          ref={setTextRef(3)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '88%',
            left: '14%',
            fontSize: '25px',
            fontWeight: 600,
            letterSpacing: '7px',
            color: 'rgba(59, 130, 246, 0.19)',
            textShadow: '0 0 25px rgba(59, 130, 246, 0.3)',
          }}
        >
          中枢
        </div>

        {/* 右侧组：决策、洞察、引擎、融合 */}
        <div
          ref={setTextRef(4)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '10%',
            left: '86%',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '9px',
            color: 'rgba(165, 243, 252, 0.19)',
            textShadow: '0 0 32px rgba(165, 243, 252, 0.3)',
          }}
        >
          决策
        </div>

        <div
          ref={setTextRef(5)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '32%',
            left: '89%',
            fontSize: '27px',
            fontWeight: 700,
            letterSpacing: '8px',
            color: 'rgba(34, 211, 238, 0.19)',
            textShadow: '0 0 32px rgba(34, 211, 238, 0.3)',
          }}
        >
          洞察
        </div>

        <div
          ref={setTextRef(6)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '60%',
            left: '88%',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '8px',
            color: 'rgba(96, 165, 250, 0.22)',
            textShadow: '0 0 34px rgba(96, 165, 250, 0.35)',
          }}
        >
          引擎
        </div>

        <div
          ref={setTextRef(7)}
          className="absolute tech-text-float whitespace-nowrap"
          style={{
            top: '86%',
            left: '87%',
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '6px',
            color: 'rgba(96, 165, 250, 0.2)',
            textShadow: '0 0 28px rgba(96, 165, 250, 0.3)',
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
                  background: 'rgba(2, 6, 18, 0.82)',
                  border: `1px solid ${
                    isFocused === 'username'
                      ? 'rgba(96, 165, 250, 0.55)'
                      : 'rgba(40, 55, 80, 0.4)'
                  }`,
                  boxShadow: isFocused === 'username'
                    ? '0 0 18px rgba(59, 130, 246, 0.15), inset 0 0 10px rgba(59, 130, 246, 0.05)'
                    : 'inset 0 1px 2px rgba(0, 0, 0, 0.35)',
                }}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={isFocused === 'username' ? '#60a5fa' : '#475569'} strokeWidth="1.5" style={{ transition: 'stroke 0.3s ease' }}>
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
                  className="flex-1 outline-none text-sm text-slate-300 placeholder-slate-700"
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
                  background: 'rgba(2, 6, 18, 0.82)',
                  border: `1px solid ${
                    isFocused === 'password'
                      ? 'rgba(96, 165, 250, 0.55)'
                      : 'rgba(40, 55, 80, 0.4)'
                  }`,
                  boxShadow: isFocused === 'password'
                    ? '0 0 18px rgba(59, 130, 246, 0.15), inset 0 0 10px rgba(59, 130, 246, 0.05)'
                    : 'inset 0 1px 2px rgba(0, 0, 0, 0.35)',
                }}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={isFocused === 'password' ? '#60a5fa' : '#475569'} strokeWidth="1.5" style={{ transition: 'stroke 0.3s ease' }}>
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
                  className="flex-1 outline-none text-sm text-slate-300 placeholder-slate-700"
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

            {/* 分隔线 */}
            <div className="my-5 flex items-center">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(51, 65, 85, 0.25) 100%)' }} />
              <span className="px-3 text-xs tracking-wider" style={{ color: 'rgba(71, 85, 105, 0.5)' }}>或</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(51, 65, 85, 0.25) 0%, transparent 100%)' }} />
            </div>

            {/* 演示账号按钮 */}
            <button
              onClick={useDemoAccount}
              className="w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-300 hover:bg-slate-800/40 active:scale-[0.98]"
              style={{
                background: 'rgba(30, 41, 59, 0.3)',
                border: '1px dashed rgba(96, 165, 250, 0.18)',
                color: 'rgba(148, 163, 184, 0.6)',
                letterSpacing: '1px',
              }}
            >
              使用演示账号快速体验
            </button>
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
