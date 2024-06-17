sap.ui.define([], function () {
	"use strict";
	return {

		/******** ZSD_UTIL_HELPF4_SRV data ********/

		// ZSD_C_UTIL_COUN_PROJ
		porcentajeTotal: function (sNumero) {

			//sNumero = parseFloat(sNumero.toString().substr(0, sNumero.toString().indexOf("%")));
			return (Math.round(sNumero * 100) / 100 ).toString()+ "%";
			/*return (sNumero.toString()+"%");*/
		},

		formatColor: function (v) {

			this.addStyleClass("red");

			return v;
		}

	};
});