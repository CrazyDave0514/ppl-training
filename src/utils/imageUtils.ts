/**
 * 图片压缩工具
 * @description 将用户选择的图片压缩到指定尺寸以内，返回 base64
 */

/**
 * 压缩图片到指定最大尺寸
 * @param file - 原始图片文件
 * @param maxSize - 最大尺寸（宽或高），默认 200
 * @param quality - JPEG 压缩质量，默认 0.8
 * @returns 压缩后的 base64 字符串
 */
export const compressImage = (
  file: File,
  maxSize: number = 200,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 等比缩放
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

/**
 * 根据出生日期计算年龄
 * @param birthDate - 出生日期 YYYY-MM-DD
 * @returns 年龄
 */
export const calcAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * 计算 BMI
 * @param weight - 体重 kg
 * @param height - 身高 cm
 * @returns BMI 值，保留 1 位小数
 */
export const calcBMI = (weight: number, height: number): number => {
  if (height <= 0) return 0;
  const heightM = height / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
};
