<template>
  <view style="width:100vw;height:100vh;">
    <web-view
      :src="h5Url"
      @message="onMessage"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      // H5 地址——改这里就能切换环境
      h5Url: 'https://your-domain.com'
    }
  },
  methods: {
    // 接收 H5 发来的消息（比如需要调用原生能力）
    onMessage(e) {
      const data = e.detail.data
      // 后期扩展：处理 H5 的原生能力请求
      console.log('Message from H5:', data)
    }
  }
}
</script>
