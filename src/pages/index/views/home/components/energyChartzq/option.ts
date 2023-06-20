/* 
  option可以直接在下面网址中改好以后替换
  https://echarts.apache.org/examples/zh/editor.html?c=line-stack
*/
export const option = { 
  title: {
    text: '蒸汽'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['洲际酒店', '假日酒店'],
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
      data:  [950.2	,684.1	,819.1,	778.4,	879.8	,857.2	,969.1	,898.45,	827.3,	854.1,	798.3	,851.2],
      smooth: true
    },
    {
      name: '假日酒店',
      type: 'line',
      data:  [0	,155.63	,165.53,	119.15,	114.06	,120.17	,157.05,	169.24,	175.37	,165.11,	167.31	,155.89],
    
      smooth: true
    },
    
  ]
};