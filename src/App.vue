<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>曲式分析可视化工具</h1>
          <el-menu mode="horizontal" :router="true" :default-active="$route.path">
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/score">乐谱分析</el-menu-item>
            <el-menu-item index="/presentation">演示模式</el-menu-item>
            <el-menu-item index="/export">导出</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  font-size: 1.5rem;
  color: #409eff;
  margin: 0;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 60px;
}

.el-main {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}
</style>