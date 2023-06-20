/* 
  option可以直接在下面网址中改好以后替换
  https://echarts.apache.org/examples/zh/editor.html?c=line-stack
*/
export const option = { 
  title: {
    text: '供冷'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['洲际酒店', '假日酒店', '会议中心','展馆','汉厅','格乐丽雅','水润天成','薇拉','绿地政务中心'],
    textStyle: {
      fontSize: 10
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '洲际酒店',
      type: 'line',
      data: [0, 0, 0, 74055.321, 228747.486, 662463.363, 1321020.8, 1332394.26, 598360.75, 146197.78, 0,0],
      smooth: true
    },
    {
      name: '假日酒店',
      type: 'line',
      data: [0,0,61516.51,200021.56,540457.57,933536.72,878855.25,320941.83,76075,0,0],
      smooth: true
    },
    {
      name: '会议中心',
      type: 'line',
      data: [0,0,0,0,0,0,0,0,0,0,0],
      smooth: true
    },
    {
      name: '展馆',
      type: 'line',
      data: [0,0,0,0,0,0,0,0,0,0,0],
      smooth: true
    },
    {
      name: '汉厅',
      type: 'line',
      data: [0,	0,	0,	0,	0,	0,	1317470,441940.72 ,	0,	0,	0,	0,      ],
      smooth: true
    },
    {
      name: '格乐丽雅',
      type: 'line',
      data: [0,	0,	0,	0,	0,	1084	,1396.5	,186777.47	,64568.59	,21583.34, 0,	0,      ],
      smooth: true
    },
    {
      name: '水润天成',
      type: 'line',
      data: [0,0,0,0,0,88777.62,177943.95, 0,0,0,0,0],
      smooth: true
    },
    {
      name: '薇拉',
      type: 'line',
      data: [0,0,0,24721,132597.7	,450049.5	,582207.3,	597384.31	,284174.12,0,0,0],
      smooth: true
    },
    {
      name: '绿地政务中心',
      type: 'line',
      data: [0,0,0,59111.8	,120027.38	,312888.71,	459999.42	,467916.58	,239324.77	,48777.81,0,0],
      smooth: true
    }
  ]
};
export const option3 = { 
  title: {
    text: '供冷'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['洲际酒店', '假日酒店', '会议中心','展馆','汉厅','格乐丽雅','水润天成','薇拉','绿地政务中心'],
    textStyle: {
      fontSize: 10
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '洲际酒店',
      type: 'line',
      data: [0, 0, 0, 74055.321, 228747.486, 662463.363, 1321020.8, 1332394.26, 598360.75, 146197.78, 0,0],
      smooth: true
    },
    {
      name: '假日酒店',
      type: 'line',
      data: [0,0,61516.51,200021.56,540457.57,933536.72,878855.25,320941.83,76075,0,0],
      smooth: true
    }
  ]
};
export const option4 = { 
  title: {
    text: '供冷'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['洲际酒店', '假日酒店', '会议中心','展馆','汉厅','格乐丽雅','水润天成','薇拉','绿地政务中心'],
    textStyle: {
      fontSize: 10
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '洲际酒店',
      type: 'line',
      data: [0, 0, 0, 74055.321, 228747.486, 662463.363, 1321020.8, 1332394.26, 598360.75, 146197.78, 0,0],
      smooth: true
    },
    {
      name: '假日酒店',
      type: 'line',
      data: [0,0,61516.51,200021.56,540457.57,933536.72,878855.25,320941.83,76075,0,0],
      smooth: true
    },
    
  ]
};