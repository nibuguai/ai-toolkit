<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="班组详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="班组编码" :value="formData?.code || '-'" />
        <wd-cell title="班组名称" :value="formData?.name || '-'" />
        <wd-cell title="班组类型">
          <dict-tag
            v-if="formData?.calendarType != null"
            :type="DICT_TYPE.MES_CAL_CALENDAR_TYPE"
            :value="formData.calendarType"
          />
          <text v-else>
            -
          </text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <TeamMemberList :team-id="teamId" />
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions content-class="yd-detail-footer-actions">
      <wd-button
        v-if="hasAccessByCodes(['mes:cal-team:update'])"
        class="flex-1"
        type="warning"
        @click="handleEdit"
      >
        编辑
      </wd-button>
      <wd-button
        v-if="hasAccessByCodes(['mes:cal-team:delete'])"
        class="flex-1"
        type="danger"
        :loading="deleting"
        @click="handleDelete"
      >
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { CalTeamVO } from '@/api/mes/cal/team'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteTeam, getTeam } from '@/api/mes/cal/team'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import TeamMemberList from '../components/team-member-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<CalTeamVO>() // 详情数据
const deleting = ref(false) // 删除状态
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/cal/team/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const teamId = computed(() => getRouteQueryNumber('id'))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/team/index')
}

/** 加载详情 */
async function getDetail() {
  if (!teamId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getTeam(teamId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
      setTimeout(() => handleBack(), 300)
      return
    }
    formData.value = detailData
  } finally {
    toast.close()
  }
}

/** 编辑班组 */
function handleEdit() {
  if (!teamId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/team/form/index?id=${teamId.value}` })
}

/** 删除班组 */
async function handleDelete() {
  if (!teamId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除「${formData.value?.name || formData.value?.code || teamId.value}」班组吗？删除后会级联清理班组成员和排班记录。`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteTeam(teamId.value)
    toast.success('删除成功')
    uni.$emit('mes:cal:team:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  getDetail()
})

watch(teamId, () => {
  getDetail()
})
</script>
