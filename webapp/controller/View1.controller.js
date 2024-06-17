sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/export/Spreadsheet",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/m/Menu",
	"sap/m/MenuItem",
	"sap/ui/model/FilterOperator",
	"model/formatter",
	"sap/ui/core/Fragment",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/m/Button"
], function (jQuery, Controller, Spreadsheet, Sorter, Filter, JSONModel, Device, Menu, MenuItem, FilterOperator, Formatter, Fragment,
	Dialog, Text, Button) {
	"use strict";
	this.aGlobalFilterItems = [];
	//this.aGlobalFilterDE = [];
	//this.aGlobalFilterFases = [];
	var oGlobalBusyDialog = new sap.m.BusyDialog();
	return Controller.extend("report.controller.View1", {

		Formatter: Formatter,
		onExportExcel: function (oEvent) {
			var oTable = this.byId("table1");
			var oModelExcel = this.getView().getModel();
			var sUrl = "";
			var sUrlCount = "";
			var sFilters = oTable.getBinding("items").sFilterParams ? oTable.getBinding("items").sFilterParams : "";
			var sOrderBy = "$orderby=mp_id%20desc"; //creadoEl
			var sComplemento = sFilters ? (sFilters + "&") : "";
			var sSearchField = this.getView().byId("searchField").getValue("");
			var sSearch = sSearchField ? `&search=${sSearchField}` : "";
			//if (oTable.getBinding().mCustomParams && oTable.getBinding().mCustomParams['search']) {
			//	sSearch = "&search=" + oTable.getBinding().mCustomParams['search'];
			//}

			sUrl = "/sap/opu/odata/sap/Z_ODATA_PMP_REPORT_SRV/ZCPM_C_UTIL_PGE_FOLLOW?" + sComplemento + sOrderBy;
			sUrlCount = "/sap/opu/odata/sap/Z_ODATA_PMP_REPORT_SRV/ZCPM_C_UTIL_PGE_FOLLOW/$count/?" + sFilters;

			var iNumRows = oTable.getBinding("items").iLength; //oTable.getBinding().iLength;
			if (iNumRows > 0) {
				var aCols = this._getColumns(); //models.columnsExcelReport(this.getView().getModel("i18n").getResourceBundle());
				var oSettings = {
					workbook: {
						columns: aCols
					},
					dataSource: {
						type: 'odata',
						dataUrl: sUrl,
						serviceUrl: oModelExcel.sServiceUrl,
						headers: oModelExcel.getHeaders ? oModelExcel.getHeaders() : null,
						//useBatch: true, // Default for ODataModel V2
						count: parseInt(iNumRows, 10)
					},
					fileName: this._getNameExcel()
				};
				var oSheet = new Spreadsheet(oSettings);
				oSheet.build().finally(function () {
					oSheet.destroy();
				});
			} else {
				MessageBox.error("ErrorNoData");
			}
		},

		tableUpdateFinished: function (oEvent) {
			this.updateNumProjects();
		},

		updateNumProjects: function () {
			var oView = this.getView();
			var oModelData = oView.getModel();
			var sQuery = oView.byId("searchField").getValue();
			var aSearchFilter = sQuery ? [new Filter("mp_id", FilterOperator.Contains, sQuery)] : [];
			var aDefaultFilters = oView.byId("table1").getBindingInfo("items").filters;
			var aFiltersTable = oView.byId("table1").getBindingInfo("items").binding.aFilters;
			var aFilters = aDefaultFilters.concat(aFiltersTable); 
			aFilters = aFilters.concat(aSearchFilter); 
			
			oModelData.read("/ZCPM_C_UTIL_PGE_FOLLOW/$count", {
				filters: aFilters,
				success: function (oData) {
					oView.byId("numeroProjectos").setNumber(`(${oData} Proyectos)`);
				}.bind(this),
				error: function (oError) {
					console.log(oError)
				}
			});

		},

		onInit: function () {},

		onBeforeRendering: function () {
			oGlobalBusyDialog.open();
			this._loadFilterData(this);
		},

		onAfterRendering: function () {

			this._mViewSettingsDialogs = {};
			oGlobalBusyDialog.close();
			var oTable = this.getView().byId("table1");
			var porcentaje = 0;
			var fase = true;
			var that = this;
			var oModel = new sap.ui.model.json.JSONModel();
		},

		onExit: function () {
			if (this._oPopover) {
				this._oPopover.destroy();
			}
		},

		cerrarPopover: function (oEvent) {
			this._oPopover.close();
		},

		handlePopoverPress: function (oEvent) {
			var oButton = oEvent.getSource();

			if (!this._oPopover) {
				Fragment.load({
					name: "controller.Popover",
					controller: this
				}).then(function (pPopover) {
					this._oPopover = pPopover;
					this.getView().addDependent(this._oPopover);
					this._oPopover.bindElement("/ProductCollection/0");
					this._oPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._oPopover.openBy(oButton);
			}
		},

		onTableSelect: function (oEvent) {

			//var project = e.getParameters().listItem.mAggregations.cells[0].mProperties.number;
			//var longitud = this.byId("table1").getItems().length;//this.byId("table1").getModel().oData.modelData.d.results.length;
			var oItemSelect = oEvent.getParameter("listItem").getBindingContext().getObject();

			var confidencial = oItemSelect.confidencial.toUpperCase();
			var pgeProy = oItemSelect.db_key.toUpperCase();
			var pgeProyFormat = pgeProy.replaceAll("-", "");

			/*
						for (var contador = 0; contador < longitud; contador++) {
							if (this.byId("table1").getModel().getProperty("/modelData/d/results/" + contador + "/mp_id") === project) {
								var mpid = this.byId("table1").getModel().getProperty("/modelData/d/results/" + contador + "/plan_id");
								var confidencial = this.byId("table1").getModel().getProperty("/modelData/d/results/" + contador + "/confidencial");
								var pgeProyecto = this.byId("table1").getModel().getProperty("/modelData/d/results/" + contador + "/db_key").toUpperCase();
								var pgeProyectoFormateado = pgeProyecto.substr(0, 8).concat(pgeProyecto.substr(9, 4)).concat(pgeProyecto.substr(14, 4)).concat(
									pgeProyecto.substr(19, 4)).concat(pgeProyecto.substr(24, 12));
							}
						}
			*/

			if (confidencial === "NO") {
				sap.m.MessageToast.show(`Opening pge of ${oItemSelect.mp_id} in new tab`);
				//https://sapdev.idom.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html?sap-client=120&sap-language=EN#FinancialPlan-manageFinancialPlan?plan_id=" + mpid )
				//window.open("https://sapgwdev.idom.wan:44300/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html?sap-language=EN#FinancialPlan-manageFinancialPlan?plan_id=" + mpid);
				window.open("https://erp.idom.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/Fiorilaunchpad.html#PGE-display?key=" +
					pgeProyFormat + "&/PgmDisplay/ZPS_C_PG_PLAN(DraftUUID=guid'00000000-0000-0000-0000-000000000000',mp_key=guid'" +
					pgeProy + "'");
			} else if (confidencial === "SI") {

				var dialog = new Dialog({
					title: "PROYECTO CONFIDENCIAL",
					type: "Message",
					content: new Text({
						text: "Proyecto confidencial, PGE no accesible. Si se quiere ver el PGE contactar con el DE para verlo conjuntamente."
					}),
					beginButton: new Button({
						text: "Si",
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			}
		},

		avoidDuplicatedElement_fast: function (arrayX, sItem) {
			var seen = {};
			var out = [];
			var len = arrayX.length;
			var j = 0;
			for (var i = 0; i < len; i++) {
				var item = arrayX[i][sItem];
				if (seen[item] !== 1) {
					seen[item] = 1;
					out[j++] = arrayX[i];
				}
			}
			return out;
		},

		_setModelFilter: function (oData, keyFilterItem, FilterName, FilterDesc) {
			var aData = oData ? oData : [];
			var aValues = [];
			var oValues = {};
			var aFilters = [];
			var oFilters = {};
			if (aData.length) {
				for (var i = 0; i < aData.length; i++) {
					oValues.textCustom = aData[i][FilterName];
					oValues.keyCustom = keyFilterItem + "___" + aData[i][FilterName];
					aValues.push(oValues);
					oValues = {};
				}
				oFilters.key = keyFilterItem;
				oFilters.desc = FilterDesc;
				oFilters.values = aValues;
				aGlobalFilterItems.push(oFilters);
			}
		},

		_loadFilterData: function (that) {

			var oModelData = that.getView().getModel();

			oModelData.read("/ZSD_C_UTIL_GEOR_EN", {
				success: function (oData) {
					var aResults = that.avoidDuplicatedElement_fast(oData.results, "GeographicalAreaName");
					aResults.sort((a, b) => a.GeographicalAreaName.localeCompare(b.GeographicalAreaName));
					that._setModelFilter(aResults, "GeoarDescription", "GeographicalAreaName", "Area Geográfica");
				}.bind(that),
				error: function (oError) {
					console.log(oError)
				}
			});

			oModelData.read("/ZSD_C_UTIL_TECAREN", {
				success: function (oData) {
					var aResults = that.avoidDuplicatedElement_fast(oData.results, "TechnicalAreaName");
					aResults.sort((a, b) => a.TechnicalAreaName.localeCompare(b.TechnicalAreaName));
					that._setModelFilter(aResults, "TecarDescription", "TechnicalAreaName", "Area Técnica");
				}.bind(that),
				error: function (oError) {
					console.log(oError)
				}
			});

			oModelData.read("/ZSD_C_UTIL_BUSLINE_EN", {
				success: function (oData) {
					var aResults = that.avoidDuplicatedElement_fast(oData.results, "BusinessLineDescription");
					aResults.sort((a, b) => a.BusinessLineDescription.localeCompare(b.BusinessLineDescription));
					that._setModelFilter(aResults, "BlineDescription", "BusinessLineDescription", "Línea de Negocio");
				}.bind(that),
				error: function (oError) {
					console.log(oError)
				}
			});
/*
			oModelData.read("/ZSD_C_UTIl_CP_Employees", {
				success: function (oData) {
					var aResults = that.avoidDuplicatedElement_fast(oData.results, "partnerName");
					aResults.sort((a, b) => a.partnerName.localeCompare(b.partnerName));
					that._setModelFilter(aResults, "name", "partnerName", "DE");
				}.bind(that),
				error: function (oError) {
					console.log(oError)
				}
			});
*/
			oModelData.read("/ZCDS_PARTNERNAME_PGE", {
				success: function (oData) {
					var aResults = that.avoidDuplicatedElement_fast(oData.results, "name");
					aResults.sort((a, b) => a.name.localeCompare(b.name));
					that._setModelFilter(aResults, "name", "name", "DE");
				}.bind(that),
				error: function (oError) {
					console.log(oError)
				}
			});

			var aFases = [{
				"faseCierre": "ABIERTO"
			}, {
				"faseCierre": "EN PROCESO DE CIERRE"
			}, {
				"faseCierre": "CERRADO"
			}];
			that._setModelFilter(aFases, "Fase_Cierre", "faseCierre", "Fase de encargo");
		},

		//FUNC
		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("mp_id", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table1");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			//this.getView().byId("numeroProjectos").setNumber(`(${oTable.getItems().length} Proyectos)`);
		},

		handleFilterDialogConfirm: function (oEvent) {
			var oTable = this.byId("table1"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				aFilters = [];

			var that = this;

			mParams.filterItems.forEach(function (oItem) {
				var aSplit = oItem.getKey().split("___"),
					sPath = aSplit[0],
					sOperator = 'EQ',
					sValue1 = aSplit[1];
				var oFilter = new Filter(sPath, sOperator, sValue1);
				aFilters.push(oFilter);
			});

			oBinding.filter(aFilters);
			var sLengthPro = that.byId("table1").getItems().length; //that.byId("table1").mBindingInfos.items.binding.aIndices.length;
			//that.getView().byId("numeroProjectos").setNumber("(" + sLengthPro + " Proyectos)");

		},

		resetFilter: function (oEvent) {
			//document.getElementById("inputFiltroDE-inner").value = "";
			//sap.ui.getCore().byId("inputFiltroDE").setValue("");
			/*	this.getView().byId("table1").getModel().setProperty("/filtrarPorDE", false);
				this.getView().byId("table1").getModel().setProperty("/filtroDE", "");*/
		},

		handleFilterButtonPressed: function () {

			var oDialog = this._mViewSettingsDialogs["controller.FilterDialog"];
			if (!oDialog) {
				aGlobalFilterItems.sort((a, b) => a.desc.localeCompare(b.desc));
				var oJson = new sap.ui.model.json.JSONModel({
					filters: aGlobalFilterItems
				});
				this.getView().setModel(oJson, "oModelFilter");
				this.getView().getModel("oModelFilter").setSizeLimit(5000);
				
				oDialog = sap.ui.xmlfragment("controller.FilterDialog", this);
				oDialog.setModel(this.getView().getModel("oModelFilter"));
				oDialog.getModel().setSizeLimit(5000);
				this._mViewSettingsDialogs["controller.FilterDialog"] = oDialog;

				if (Device.system.desktop) {
					oDialog.addStyleClass("sapUiSizeCompact");
				}
			}
			return oDialog.open();

		},

		createViewSettingsDialog: function (sDialogFragmentName) {
			var oDialog = this._mViewSettingsDialogs[sDialogFragmentName];

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(sDialogFragmentName, this);
				this._mViewSettingsDialogs[sDialogFragmentName] = oDialog;

				if (Device.system.desktop) {
					oDialog.addStyleClass("sapUiSizeCompact");
				}
			}
			return oDialog;
		},

		handleSortDialogConfirm: function (oEvent) {
			var oTable = this.byId("table1"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},
		handleSortButtonPressed: function () {
			this.createViewSettingsDialog("controller.SortDialog").open();
		},

		localFormatterDate: function (sDate) {
			if (sDate) {
				sDate = sDate.replaceAll("/", "");
				var year = sDate.substr(0, 4);
				var month = sDate.substr(4, 2);
				var day = sDate.substr(6, 2);
			}
			return sDate ? new Date(year, month - 1, day) : null;
		},

		_getNameExcel: function () {
			var hoy = new Date();
			var dia = hoy.getDate();
			if (dia.toString().length < 2) {
				dia = "0".concat(dia.toString());
			}
			var year = hoy.getFullYear();
			var mes = hoy.getMonth() + 1;
			if (mes.toString().length < 2) {
				mes = "0".concat(mes.toString());
			}
			var hora = hoy.getHours();
			if (hora.toString().length < 2) {
				hora = "0".concat(hora.toString());
			}
			var minuto = hoy.getMinutes();
			if (minuto.toString().length < 2) {
				minuto = "0".concat(hora.toString());
			}
			return "SGI-ListadoProyectos-" + year.toString() + mes.toString() + dia.toString() + hora.toString() + minuto.toString() + '.xlsx';
		},

		_getColumns: function () {
			var oJson = new JSONModel();
			oJson.loadData("./model/columns.json", null, false);
			return oJson.oData;
		}

		/*
				onExcelDataExport: sap.m.Table.prototype.exportData || function (oEvent) {

					var that = this;
					var oModelExcel = new sap.ui.model.json.JSONModel("localService/lista.json");

					oModelExcel.attachRequestCompleted(function (oMODE) {
						oModelExcel.setData({
							modelData: oModelExcel.oData
						});

						var aItems = that.byId("table1").getItems(); //that.byId("table1").mBindingInfos.items.binding.aIndices;
						var oItems = {};
						var aModelItems = [];
						//var longitudIndices = that.byId("table1").getItems().length; //that.byId("table1").mBindingInfos.items.binding.aIndices.length;
						var contarIndices = 0;
						
						for (var i = 0; i < aItems.length; i++) {
							oItems = aItems[i].getBindingContext().getObject();

							oItems.creadoEl = oItems.creadoEl === '0' ? '' : oItems.creadoEl;
							oItems.creadoEl = that.localFormatterDate(oItems.creadoEl);

							oItems.PGEcerradoEL = oItems.PGEcerradoEL === '0' ? '' : oItems.PGEcerradoEL;
							oItems.PGEcerradoEL = that.localFormatterDate(oItems.PGEcerradoEL);
							aModelItems.push(oItems);
							oItems = {};
						}
						oModelExcel.setProperty(`/modelData/Projects/`, aModelItems);

						//oModelExcel.setProperty("/modelData/Projects/length", contarIndices - 1);
						var nombreExcel = that._getNameExcel();
						var oSpreadsheet = new Spreadsheet({
							dataSource: oModelExcel.oData.modelData.Projects,
							fileName: nombreExcel + ".xlsx",
							workbook: {}
						});
						oSpreadsheet.onprogress = function (iValue) {
							jQuery.sap.log.debug("Export: " + iValue + "% completed");
						};
						oSpreadsheet.build().then(function () {
							jQuery.sap.log.debug("Export is finished");
						}).catch(function (sMessage) {
							jQuery.sap.log.error("Export error: " + sMessage);
						});
					});
				},
		*/
	});

});