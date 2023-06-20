(function (window, undefined) {
    window.oncontextmenu = function (e) {
        if (e.preventDefault)
            e.preventDefault();
        if (e.stopPropagation)
            e.stopPropagation();
        return false;
    };

    window.onclick = function (e) {
		$("#context-menu").hide();
	};

	window.firstTime = true;

    function insertString(field) {
		var editorType = window.Asc.plugin.info.editorType;
		// callCommand执行上下文与当前环境不一致，需通过Asc.scope对象传递参数
		Asc.scope.field = field;
		if (editorType === "word") {
			window.Asc.plugin.callCommand(function () {
				var oDocument = Api.GetDocument();
				var oParagraph = Api.CreateParagraph();
				oParagraph.AddText(Asc.scope.field);
				oDocument.InsertContent([oParagraph], true);
			}, false);
		} else if (editorType === "cell") {
			window.Asc.plugin.callCommand(function () {
				var oWorksheet = Api.GetActiveSheet();
				var oCell = oWorksheet.GetActiveCell();
				var value = oCell.GetValue();
				oCell.SetValue(value + Asc.scope.field);
			}, false);
		}
	}

    window.Asc.plugin.init = function () {
		$("#context-menu").hide();

    	var templateId = window.Asc.plugin.info.documentTitle.split(".")[0];
		var treeObj = $("#tree");
		var setting = {
			view: {
				showLine: false,
				showIcon: false,
				selectedMulti: false,
				dblClickExpand: false,
			},
			callback: {
				beforeClick: beforeClick,
				onClick: onClick,
				beforeRightClick: beforeClick,
				onRightClick: onRightClick
			}
		};

		var systemFields = {
			WORKFLOW: {
				id: "system",
				name: "系统字段",
				open: true,
				children: [
					{id: "processInstanceTile", name: "实例标题", text: "{实例标题}"},
					{id: "originator", name: "发起人", text: "{发起人}"},
					{id: "createTime", name: "创建时间", text: "{创建时间}"},
					{id: "modifiedTime", name: "修改时间", text: "{修改时间}"},
					{id: "serialNo", name: "流水号", text: "{流水号}"},
					{id: "orderNo", name: "序号", text: "{序号}"}
				]
			},
			RECEIPT: {
				id: "system",
				name: "系统字段",
				open: true,
				children: [
					{id: "originator", name: "发起人", text: "{发起人}"},
					{id: "createTime", name: "创建时间", text: "{创建时间}"},
					{id: "modifiedTime", name: "修改时间", text: "{修改时间}"},
					{id: "orderNo", name: "序号", text: "{序号}"}
				]
			},
			REPORT: null,
			SHOW: null
		};
		var commonFields = [
			{
				id: "countersign",
				name: "会签意见",
				open: true,
				children: [
					{id: "countersignId", name: "主键", text: "{主键}"},
					{id: "departmentId", name: "部门主键", text: "{部门主键}"},
					{id: "advice", name: "意见", text: "{意见}"},
					{id: "signPic", name: "签字图片", text: "{签字图片}"},
					{id: "nodeId", name: "节点主键", text: "{节点主键}"},
					{id: "adviceType", name: "意见类型", text: "{意见类型}"},
					{id: "creator", name: "创建人", text: "{创建人}"},
					{id: "instanceId", name: "流程实例", text: "{流程实例}"},
					{id: "signTime", name: "签字时间", text: "{签字时间}"},
					{id: "signer", name: "签字人", text: "{签字人}"},
					{id: "serialNo", name: "序号", text: "{序号}"}
				]
			}
		];
		var zNodesRaw = [];
		var zNodes = [];

		if (window.firstTime) {
			window.firstTime = false;
			$.get("http://www.egova.top:31001/free/printingTemplate/" + templateId + "/dataSource", function(res) {
				if (res && !res.hasError) {
					zNodesRaw.push(filterDataSource(res.result.mainTable));
					if (res.result.childTables.length > 0) {
						res.result.childTables.forEach(item => {
							zNodesRaw.push(filterDataSource(item));
						});
					}
					// if (systemFields.hasOwnProperty(res.result.pageType) && systemFields[res.result.pageType]) {
					// 	zNodesRaw.push(systemFields[res.result.pageType]);
					// }
					// zNodesRaw = zNodesRaw.concat(commonFields);
					zNodes = JSON.parse(JSON.stringify(zNodesRaw));
					$.fn.zTree.init(treeObj, setting, zNodes);
				}
			});
		}

		function filterDataSource(raw) {
			let res = {
				id: raw.id,
				text: raw.text,
				open: true,
				name: raw.text.replace(/[\{\}]/g, "")
			};

			if (raw.columns.length > 0) {
				res.children = [];
				raw.columns.forEach(item => {
					let title = item.text.replace(/[\{\}]/g, "");
					title = title.split(".");
					if (title.length > 1) title = title[title.length - 1]; else title = title[0];
					let tmp = {
						id: item.id,
						text: item.text,
						name: title
					};
					res.children.push(tmp);
				});
			}

			return res;
		}

		function onSearchClick(keyword) {
			zNodes = JSON.parse(JSON.stringify(zNodesRaw));
			keyword = keyword.trim();
			if (keyword) {
				var searchData = [];
				searchByKeyword(keyword, searchData, zNodes);
				zNodes = searchData;
			}
			$.fn.zTree.destroy();
			$.fn.zTree.init(treeObj, setting, zNodes);
		}

		function searchByKeyword(keyword, target, raw) {
			for (let i = 0; i < raw.length; i++) {
				let item = raw[i];
				if (item.children && item.children.length > 0) {
					let tmp = JSON.parse(JSON.stringify(item));
					tmp.children = [];
					searchByKeyword(keyword, tmp.children, item.children);
					if (tmp.children.length > 0) {
						target.push(tmp);
					}
				} else {
					if (item.name.indexOf(keyword) !== -1) {
						let tmp = JSON.parse(JSON.stringify(item));
						target.push(tmp);
					}
				}
			}
		}

		function beforeClick(treeId, treeNode) {
			if (treeNode.level === 0) {
				var zTree = $.fn.zTree.getZTreeObj("tree");
				zTree.expandNode(treeNode);
				$("#context-menu").hide();
				return false;
			}
			return true;
		}

		function onClick(e, treeId, treeNode) {
			insertString(treeNode.text);
		}

		function onRightClick(e, treeId, treeNode) {
			e.preventDefault();
			let father = treeNode.getParentNode();
			if (father.id === "system") return;
			let context = $("#context-menu");
			context.css({
				"left": e.clientX + "px",
				"top": e.clientY + "px"
			});
			window.selectNode = treeNode;
			context.show();
		}

        $("#btn_search").off("click").on("click", function (e) {
			var keyword = $("#input-search").val();
			onSearchClick(keyword);
		});

		$("#input-search").off("keypress").on("keypress",function(event) {
			if (event.keyCode === 13) {
				var keyword = $("#input-search").val();
				onSearchClick(keyword);
			}
		});

		$("#context-menu-sum").off("click").on("click", function (e) {
			e.stopPropagation();
			insertString("SUM(" + window.selectNode.text + ")");
			$("#context-menu").hide();
		});

		$("#context-menu-average").off("click").on("click", function (e) {
			e.stopPropagation();
			insertString("AVERAGE(" + window.selectNode.text + ")");
			$("#context-menu").hide();
		});

		$("#context-menu-max").off("click").on("click", function (e) {
			e.stopPropagation();
			insertString("MAX(" + window.selectNode.text + ")");
			$("#context-menu").hide();
		});

		$("#context-menu-min").off("click").on("click", function (e) {
			e.stopPropagation();
			insertString("MIN(" + window.selectNode.text + ")");
			$("#context-menu").hide();
		});
	};

    window.Asc.plugin.button = function (id) {
		this.executeCommand("close", "");
    };
})(window, undefined);
