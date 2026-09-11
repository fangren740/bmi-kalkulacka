(function(global){
  "use strict";
  const A=17.625, B=243.04, C=0.61094;
  function isFiniteNumber(v){ return typeof v === "number" && Number.isFinite(v); }
  function saturationVaporPressureKPa(tempC){
    if(!isFiniteNumber(tempC)) return NaN;
    return C*Math.exp((A*tempC)/(B+tempC));
  }
  function dewPointC(tempC,rhPct){
    if(!isFiniteNumber(tempC)||!isFiniteNumber(rhPct)||rhPct<=0||rhPct>100) return NaN;
    const gamma=Math.log(rhPct/100)+(A*tempC)/(B+tempC);
    return B*gamma/(A-gamma);
  }
  function actualVaporPressureKPa(tempC,rhPct){
    const sat=saturationVaporPressureKPa(tempC);
    return Number.isFinite(sat)&&isFiniteNumber(rhPct)?sat*rhPct/100:NaN;
  }
  function absoluteHumidityGm3(tempC,vaporKPa){
    if(!isFiniteNumber(tempC)||!isFiniteNumber(vaporKPa)||tempC<=-273.15) return NaN;
    return 216.7*(vaporKPa*10)/(tempC+273.15);
  }
  function surfaceRelativeHumidityPct(vaporKPa,surfaceTempC){
    const sat=saturationVaporPressureKPa(surfaceTempC);
    if(!isFiniteNumber(vaporKPa)||!Number.isFinite(sat)||sat<=0) return NaN;
    return 100*vaporKPa/sat;
  }
  function calculate(input){
    const t=Number(input.airTempC), rh=Number(input.rhPct);
    if(!isFiniteNumber(t)||t<-40||t>50) return {ok:false,error:"Teplota vzduchu musí být v rozsahu −40 až +50 °C."};
    if(!isFiniteNumber(rh)||rh<1||rh>100) return {ok:false,error:"Relativní vlhkost musí být v rozsahu 1 až 100 %."};
    const e=actualVaporPressureKPa(t,rh);
    const td=dewPointC(t,rh);
    const ah=absoluteHumidityGm3(t,e);
    const result={ok:true,airTempC:t,rhPct:rh,vaporKPa:e,dewPointC:td,absoluteHumidityGm3:ah};
    if(input.surfaceTempC!==undefined && input.surfaceTempC!==null){
      const ts=Number(input.surfaceTempC);
      if(!isFiniteNumber(ts)||ts<-50||ts>80) return {ok:false,error:"Teplota povrchu musí být v rozsahu −50 až +80 °C."};
      const rawRh=surfaceRelativeHumidityPct(e,ts);
      result.surfaceTempC=ts;
      result.marginC=ts-td;
      result.condensationPossible=ts<=td;
      result.surfaceRhRawPct=rawRh;
      result.surfaceRhDisplayPct=Math.min(100,rawRh);
    }
    return result;
  }
  global.RVDewPointCore={A,B,C,saturationVaporPressureKPa,dewPointC,actualVaporPressureKPa,absoluteHumidityGm3,surfaceRelativeHumidityPct,calculate};
})(window);