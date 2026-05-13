<template>
  <div class="home">
    <div class="hero">
      <h2>曲式分析可视化工具</h2>
      <p>专业的古典奏鸣曲式分析可视化工具，支持MusicXML导入、自定义排版、分层曲式标注、渐进展示和PDF导出。</p>
      <el-button type="primary" size="large" @click="goToScore">
        开始分析
      </el-button>
    </div>
    
    <div class="features">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="feature-card">
            <template #header>
              <div class="card-header">
                <span>乐谱导入</span>
              </div>
            </template>
            <div class="card-content">
              <p>支持标准MusicXML格式文件导入，自动解析乐谱结构、调号、拍号等基础数据。</p>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="feature-card">
            <template #header>
              <div class="card-header">
                <span>自定义排版</span>
              </div>
            </template>
            <div class="card-content">
              <p>自由调节行间距、手动拆行合并、分页重排，保持乐理排版规范。</p>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="feature-card">
            <template #header>
              <div class="card-header">
                <span>分层标注</span>
              </div>
            </template>
            <div class="card-content">
              <p>支持基础结构层、动机层、和声层、注释层分层可视化，按难度分级展示。</p>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="feature-card">
            <template #header>
              <div class="card-header">
                <span>PDF导出</span>
              </div>
            </template>
            <div class="card-content">
              <p>导出矢量高清PDF，保留当前谱面排版、标注图层，适配打印输出。</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToScore = () => {
  router.push('/score')
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 40px;
}

.hero h2 {
  font-size: 2.5rem;
  margin: 0 0 20px 0;
}

.hero p {
  font-size: 1.1rem;
  margin: 0 0 30px 0;
  opacity: 0.9;
}

.features {
  margin-top: 40px;
}

.feature-card {
  height: 200px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-weight: bold;
  color: #409eff;
}

.card-content {
  color: #666;
}

.card-content p {
  margin: 0;
  line-height: 1.6;
}
</style>