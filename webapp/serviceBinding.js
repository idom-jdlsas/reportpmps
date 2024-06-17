function initModel() {
	var sUrl = "/sap/opu/odata/sap/Z_ODATA_PMP_REPORT_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}