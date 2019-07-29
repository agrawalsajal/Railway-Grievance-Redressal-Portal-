
plotObj = {}

plotObj.plot1 = function(comps, callback){
	var stat = new Array(3);	
	for (var i = 0; i < stat.length; i++) {
		stat[i] = new Array(12).fill(0);
	}
	stat[2] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var y2 = new Date().getFullYear()
	var m2 = new Date().getMonth()
	var a1 = stat[2].slice(0,m2+1)
	var a2 = stat[2].slice(m2+1)
	// console.log(a1)
	// console.log(a2)
	stat[2] = a2.concat(a1)
	var regSum = 0;
	var resSum = 0;
	var promises = comps.map(function(comp){
		// console.log(comp.title);
		return new Promise(function(resolve){
			
			if(comp.status < 4){
				var y1 = comp.dateReg.getFullYear()
				var m1 = comp.dateReg.getMonth()
				// console.log(y1)
				if(y1 === y2 && m1 <= m2){
					regSum++;
					stat[0][11-m2+m1]++;
				} else if(y1 === y2-1 && m1 > m2){
					stat[0][m1-m2-1]++;
				}
			} else if(comp.status == 4){
				var y1 = comp.dateFinish.getFullYear()
				var m1 = comp.dateFinish.getMonth()
				// console.log(y1)
				if(y1 === y2 && m1 <= m2){
					resSum++;
					stat[1][11-m2+m1]++;
				} else if(y1 === y2-1 && m1 > m2){
					stat[1][m1-m2-1]++;
				}
			}
			resolve()
		})
	})
	Promise.all(promises).then(function(){
		// console.log(stat);
		callback(stat, regSum, resSum);
	})
}



module.exports = plotObj