import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const avifQuality = 20;

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 清空文件夹的函数
async function emptyDirectory(directory) {
  const files = await fs.readdir(directory);
  for (const file of files) {
    const filePath = path.join(directory, file);
    await fs.unlink(filePath);
  }
  console.log(`清空文件夹: ${directory}`);
}

async function convertImagesToAvif(sourcePath) {
  try {
    // 读取源路径下的所有条目（文件和文件夹）
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(sourcePath, entry.name);
      const projectName = path.basename(sourcePath);
      // 检查是否为名为"rawimg"的文件夹
      if (entry.isDirectory() && entry.name === "rawimg") {
        // 创建对应的"img"文件夹
        const imgDir = path.join(path.dirname(fullPath), "img");
        await fs.mkdir(imgDir, { recursive: true });

        // 清空img文件夹
        await emptyDirectory(imgDir);

        // 读取"rawimg"文件夹中的所有图片
        const images = await fs.readdir(fullPath);
        for (const image of images) {
          const imagePath = path.join(fullPath, image);
          // 设置输出路径，将扩展名改为.avif
          const outputPath = path.join(
            imgDir,
            path.parse(image).name + ".avif"
          );

          // 使用sharp库将图片转换为AVIF格式
          await sharp(imagePath)
            .avif({ quality: avifQuality })
            .toFile(outputPath);

          console.log(
            `转换完成: ${projectName}-${image} 已转为AVIF,大小为${(
              (await fs.stat(outputPath)).size / 1024
            ).toFixed(2)} Kb`
          );
        }
      } else if (entry.isDirectory()) {
        // 如果是其他文件夹，递归调用函数
        await convertImagesToAvif(fullPath);
      }
    }
  } catch (error) {
    console.error("图片转换过程中出现错误:", error);
  }
}

// 设置项目文件夹路径
const projectsPath = path.join(__dirname, ".", "projects");
// 开始转换过程
convertImagesToAvif(projectsPath).catch(console.error);
