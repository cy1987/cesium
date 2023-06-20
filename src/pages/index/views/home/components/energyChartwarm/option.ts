/* 
  option可以直接在下面网址中改好以后替换
  https://echarts.apache.org/examples/zh/editor.html?c=line-stack
*/
export const option = { 
  title: {
    text: '供热'
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
      data: [643058.83	,473494.44	,51866.58,	0,	0,	0,	0,	0,	0,	0,	34887.11	,572540.58],
      smooth: true
    },
    {
      name: '假日酒店',
      type: 'line',
      data: [497305.56	,453222.22,	143361.1	,0,	0,	0,	0,	0	,0	,0,	0	,616545.16],
      smooth: true
    },
    {
      name: '会议中心',
      type: 'line',
      data: [430027.78	,539305.56	,14944.41,	0,	0	,0,	0	,0	,0,	0,	43166.65,	357880.88],
      smooth: true
    },
    {
      name: '展馆',
      type: 'line',
      data: [97341	,42389	,0	,0,	0	,0,	0,	0,	0,	0	,0	,477970.53],
      smooth: true
    },
    {
      name: '汉厅',
      type: 'line',
      data: [824697.9	,130376,	0,	0,	0,	0	,0	,0,	0,	0	,625976.39	,948673.7],
      smooth: true
    },
    {
      name: '格乐丽雅',
      type: 'line',
      data: [35027.78 	,53694.44 ,	0	,0	,0,	0	,0,	0	,0,	0	,0	,12717.33],
      smooth: true
    },
    {
      name: '水润天成',
      type: 'line',
      data: [0,0,0,0,0,0,0, 0,0,0,0,0],
      smooth: true
    },
    {
      name: '薇拉',
      type: 'line',
      data: [168472.22 	,206361.11 ,	139870.1	,0,	0,	0,	0,	0	,0,	0	,51515.59	,533062.33],
      smooth: true
    },
    {
      name: '绿地政务中心',
      type: 'line',
      data: [454143.33 	,447175.56 ,	47500	,0	,0,	0,	0,	0	,0,	0	,13861.11	,257688.49],
      smooth: true
    }
  ]
};