/* 
  option可以直接在下面网址中改好以后替换
  https://echarts.apache.org/examples/zh/editor.html?c=line-stack
*/
export const option = { 
  title: {
    text: '供电'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['向洲际售电', '向办公售电'],
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
      name: '向洲际售电',
      type: 'line',
      data:   [145564.00 ,320577.46,0,0,0,0,0,0,0,0,0,0],
      smooth: true
    },
    {
      name: '向办公售电',
      type: 'line',
      data:   [658635.00 ,	1390417	,0,0,0,0,0,2809280	,2162200	,323840,	922080	,2090240,],
    
      smooth: true
    }
    
  ]
};