import { normalizeMacroConfig, createActionStep, createBlankDelayStep, exportMacroJson } from "../codec/action-model.mjs";
import { apgToEditableModel } from "../codec/apg-to-model.mjs";
import { rebuildAPGFromEditableModel } from "../codec/apg-edit-rebuild.mjs";
import { encodeAPG } from "../codec/apg-codec.mjs";
const $=id=>document.getElementById(id), BUTTONS=["A","B","X","Y","LB","RB","LT","RT","L3","R3","START","SELECT","HOME","D_UP","D_DOWN","D_LEFT","D_RIGHT","D_UP_LEFT","D_UP_RIGHT","D_DOWN_LEFT","D_DOWN_RIGHT"], STICKS=["L_STICK","R_STICK"], DIRS=["UP","DOWN","LEFT","RIGHT"];
let config={fileName:"macro",version:"1.0",macroList:[]}, importedModel=null, originalBytes=null, serial=0, activeStepId=null;
const newId=()=>"local-"+Date.now()+"-"+(++serial);
const status=(s,bad=false)=>{$("status").textContent=s;$("status").style.color=bad?"#ff9f9f":"var(--accent)";};
const base=()=>(($("fileName").value.trim()||"macro").replace(/[\\/:*?"<>|]/g,"_"));
function download(name,data,type){const u=URL.createObjectURL(new Blob([data],{type})),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function publicConfig(){const out=JSON.parse(JSON.stringify(config));for(const step of out.macroList)delete step.apgSource;return out;}
function move(i,d){const x=config.macroList.splice(i,1)[0];config.macroList.splice(i+d,0,x);render();}

function localizeWarning(message){
  const translations = [
    ["APG stores one D-pad direction and one signed value per stick axis. If the source JSON held multiple simultaneous directions on the same D-pad/stick axis (including opposite directions), the APG cannot retain the full combination; import can only recover the encoded axis/direction state.","APG 每个记录只能保存一个方向键方向，以及每个摇杆轴的一个带符号数值。如果源 JSON 在同一个方向键或摇杆轴上同时包含多个方向（包括相反方向），APG 无法保留完整组合；导入时只能恢复实际编码的轴和方向状态。"],
    ["APG records do not store original JSON step boundaries or exact millisecond delays. Adjacent identical states are merged into one inferred run, and delayMsRange is the full set of integer delays compatible with its record count.","APG 记录不保存原始 JSON 的步骤边界或精确毫秒延时。相邻且状态相同的记录会合并为一个推断步骤；delayMsRange 表示与该记录数量相匹配的全部整数延时范围。"],
    ["One or more step delays are ambiguous. Editable delay values are inferred; see apgSource.possibleDelayMs before accepting or changing them.","一个或多个步骤的延时存在歧义。可编辑延时为推断值；确认或修改前，请查看 apgSource.possibleDelayMs。"],
    ["ABXY interpretation was unresolved; select PC or SWITCH layout and re-import.","无法确定 ABXY 按键布局；请选择 PC 或 SWITCH 布局后重新导入。"],
    ["Stick values are approximate inversions of rounded axis values; original UI values may not be recoverable exactly.","摇杆数值是根据取整后的轴值近似反推的，可能无法精确恢复原始界面数值。"],
    ["Runs are inferred from adjacent identical controller-state bytes; separate neighbouring steps with identical states cannot be distinguished.","步骤是根据相邻且控制器状态字节相同的记录推断出来的；无法区分相邻且状态完全相同的独立步骤。"],
    ["Original delay is not uniquely recoverable in general; delayMsRange is the integer-millisecond range consistent with the official 79-records/second ceiling formula.","通常无法唯一恢复原始延时；delayMsRange 是符合官方每秒 79 条记录上限公式的整数毫秒范围。"],
    ["Marker/counter bytes are excluded from state comparison; original record bytes remain available in each run.","比较控制器状态时会排除 Marker/Counter 字节；每个步骤仍保留原始记录字节。"],
    ["At least three complete records are required to infer a stable counter progression.","至少需要三条完整记录，才能推断稳定的 Counter 递增规律。"],
    ["More than one fill/profile interpretation is plausible.","存在多种可能的填充区/配置解释。"],
    ["No unique aligned fill suffix with a stable marker and counter progression was found.","未找到唯一且对齐的填充区后缀，也未找到稳定的 Marker 和 Counter 递增规律。"],
    ["Do not guess from 0xFF or 0x67 alone; supply recordCount manually and preserve the remaining bytes.","不要仅凭 0xFF 或 0x67 猜测记录边界；请手动填写 recordCount，并保留剩余字节。"],
    ["Boundary is inferred from an aligned uniform 0xFF/0x67 suffix plus a stable marker/counter pattern; it is not a universal APG terminator rule.","记录边界是根据对齐的连续 0xFF/0x67 后缀以及稳定的 Marker/Counter 模式推断的，并非适用于所有 APG 文件的通用结束规则。"],
    ["A legitimate final record that coincidentally matches the fill pattern cannot be distinguished from padding using this evidence alone. Preserve the original file and allow manual recordCount override.","如果最后一条有效记录恰好与填充模式相同，仅凭这些证据无法将其与填充区区分。请保留原文件，并允许手动指定 recordCount。"],
    ["File is too short to establish a stable marker/counter pattern.","文件太短，无法建立稳定的 Marker/Counter 模式。"]
  ];
  const exact = translations.find(([source])=>source===message)?.[1];
  if (exact) return exact;
  const dpad = message.match(/^Record (\d+): unknown D-pad value (0x[0-9a-f]+)$/i);
  if (dpad) return `第 ${dpad[1]} 条记录：未知的方向键数值 ${dpad[2]}`;
  const marker = message.match(/^Record (\d+): marker is (0x[0-9a-f]+), not sample marker 0x02$/i);
  if (marker) return `第 ${marker[1]} 条记录：Marker 为 ${marker[2]}，与样本 Marker 0x02 不一致`;
  const markerChange = message.match(/^Marker changes at record (\d+); the sample-style constant-marker pattern does not hold\.$/);
  if (markerChange) return `Marker 在第 ${markerChange[1]} 条记录发生变化，不符合样本中的固定 Marker 模式。`;
  const counterChange = message.match(/^Counter progression changes at record (\d+); automatic boundary is not safe\.$/);
  if (counterChange) return `Counter 在第 ${counterChange[1]} 条记录发生变化，自动判断记录边界不安全。`;
  return message;
}


function localizeError(message){
  const known = [
    ['recordCount must be supplied as a non-negative integer','recordCount 必须是非负整数。'],
    ['abxyLayout must be explicitly "PC" or "SWITCH"','必须明确选择 PC 或 SWITCH 按键布局。'],
    ['preferredDelayMs must be a finite non-negative number','preferredDelayMs 必须是有限的非负数。'],
    ['input must be a Uint8Array, ArrayBuffer, or ArrayBuffer view','输入必须是 Uint8Array、ArrayBuffer 或 ArrayBuffer 视图。'],
    ['APG record range is ambiguous; provide recordCount manually.','APG 记录范围不明确，请手动填写 recordCount。']
  ];
  let output=message;
  for(const [source,target] of known) output=output.replace(source,target);
  output=output.replace(/recordCount exceeds file capacity \((\d+)\)/g,'recordCount 超出文件容量（$1 条记录）');
  return output.split(". ").map(part=>localizeWarning(part.endsWith(".")?part:part+".")).join("。");
}

function renderButtonEditor(step){
  const bg=$("buttonGrid");bg.replaceChildren();
  for(const bid of BUTTONS){
    const l=document.createElement("label");l.className="check key-"+bid.toLowerCase().replaceAll("_","-");l.dataset.button=bid;
    const c=document.createElement("input");c.type="checkbox";c.checked=step.buttons.some(x=>x.id===bid);c.setAttribute("aria-label",bid);
    l.classList.toggle("selected",c.checked);
    c.onchange=()=>{step.buttons=step.buttons.filter(x=>x.id!==bid);if(c.checked)step.buttons.push({id:bid,label:bid,type:["LT","RT"].includes(bid)?"trigger":"button"});l.classList.toggle("selected",c.checked);step.isBlankDelay=false;};
    const caption=document.createElement("span");
    caption.textContent=({D_UP:"↑",D_DOWN:"↓",D_LEFT:"←",D_RIGHT:"→",D_UP_LEFT:"↖",D_UP_RIGHT:"↗",D_DOWN_LEFT:"↙",D_DOWN_RIGHT:"↘",START:"＋",SELECT:"－",HOME:"⌂",LB:"L",RB:"R",LT:"ZL",RT:"ZR",L3:"L3",R3:"R3"})[bid]??bid;
    l.append(c,caption);bg.append(l);
  }
}
function renderStickEditor(step){
  const sg=$("stickGrid");sg.replaceChildren();
  for(const sid of STICKS){
    const card=document.createElement("div");card.className="stick-card";
    const title=document.createElement("strong");title.textContent=sid==="L_STICK"?"左摇杆":"右摇杆";card.append(title);
    for(const dir of DIRS){
      const old=step.sticks.find(x=>x.stick.id===sid&&x.direction===dir),l=document.createElement("label"),c=document.createElement("input"),v=document.createElement("input");
      c.type="checkbox";c.checked=!!old;v.type="number";v.min="0";v.max="100";v.step="1";v.value=old?.value??100;v.disabled=!old;
      c.onchange=()=>{step.sticks=step.sticks.filter(x=>!(x.stick.id===sid&&x.direction===dir));if(c.checked)step.sticks.push({stick:{id:sid,label:sid==="L_STICK"?"Left Stick":"Right Stick",type:"stick"},direction:dir,value:Number(v.value)});v.disabled=!c.checked;};
      v.onchange=()=>{const x=step.sticks.find(x=>x.stick.id===sid&&x.direction===dir);if(x)x.value=Number(v.value);};
      l.append(c,document.createTextNode(dir+" (%)"),v);card.append(l);
    }
    sg.append(card);
  }
}
function stepSummary(step){
  if(step.isBlankDelay)return "空白延时：无按键或摇杆";
  const buttonNames={
    A:"A",B:"B",X:"X",Y:"Y",LB:"L",RB:"R",LT:"ZL",RT:"ZR",
    L3:"左摇杆按压（L3）",R3:"右摇杆按压（R3）",START:"＋键",SELECT:"－键",HOME:"HOME",
    D_UP:"方向键↑",D_DOWN:"方向键↓",D_LEFT:"方向键←",D_RIGHT:"方向键→",
    D_UP_LEFT:"方向键↖",D_UP_RIGHT:"方向键↗",D_DOWN_LEFT:"方向键↙",D_DOWN_RIGHT:"方向键↘"
  };
  const buttons=step.buttons.map(buttonNames[x=>x.id] ?? buttonNames.A);
  const sticks=step.sticks.map(item=>{
    const side=item.stick.id==="L_STICK"?"左摇杆":"右摇杆";
    const direction={UP:"上",DOWN:"下",LEFT:"左",RIGHT:"右"}[item.direction]??item.direction;
    return side+direction+" "+item.value+"%";
  });
  const parts=[];
  if(buttons.length)parts.push("按键："+buttons.join("、"));
  if(sticks.length)parts.push("摇杆："+sticks.join("、"));
  return parts.length?parts.join("；"):"未设置按键或摇杆";
}
function render(){
  $("fileName").value=config.fileName;const host=$("steps");host.replaceChildren();
  if(!config.macroList.length){host.innerHTML='<div class="empty">当前没有步骤。请使用上方按钮添加。</div>';activeStepId=null;$("stepEditor").classList.add("hidden");return;}
  if(!config.macroList.some(step=>step.id===activeStepId&&!step.isBlankDelay))activeStepId=config.macroList.find(step=>!step.isBlankDelay)?.id??null;
  config.macroList.forEach((step,i)=>{
    const n=$("stepTemplate").content.firstElementChild.cloneNode(true);n.draggable=true;n.classList.toggle("active-step",step.id===activeStepId);
    n.setAttribute("aria-selected",String(step.id===activeStepId));
    n.addEventListener("click",e=>{
      if(step.isBlankDelay||e.target.closest("button,input,select,textarea,a,label"))return;
      if(activeStepId!==step.id){activeStepId=step.id;render();}
    });
    n.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",String(i));e.dataTransfer.effectAllowed="move";});
    n.addEventListener("dragover",e=>{e.preventDefault();e.dataTransfer.dropEffect="move";});
    n.addEventListener("drop",e=>{e.preventDefault();const from=Number(e.dataTransfer.getData("text/plain"));if(Number.isInteger(from)&&from!==i&&from>=0&&from<config.macroList.length){const [moved]=config.macroList.splice(from,1);config.macroList.splice(i,0,moved);render();}});
    n.querySelector(".step-title").textContent=(i+1)+". "+(step.isBlankDelay?"空白延时":"动作步骤");
    const summary=document.createElement("p");summary.className="step-summary";
    summary.textContent=stepSummary(step);summary.classList.toggle("hidden",step.id===activeStepId&&!step.isBlankDelay);
    n.querySelector(".step-head").after(summary);
    const delay=n.querySelector(".delay");delay.value=step.delay;delay.onchange=()=>step.delay=Number(delay.value);
    n.querySelector(".blank-note").classList.toggle("hidden",!step.isBlankDelay);
    n.querySelector(".convert-action").onclick=()=>{step.isBlankDelay=false;activeStepId=step.id;render();};
    const edit=n.querySelector(".edit-step");edit.disabled=!!step.isBlankDelay;edit.textContent=step.id===activeStepId?"正在编辑":"选中并编辑";edit.onclick=()=>{activeStepId=step.id;render();};
    n.querySelector(".up").disabled=i===0;n.querySelector(".down").disabled=i===config.macroList.length-1;
    n.querySelector(".up").onclick=()=>move(i,-1);n.querySelector(".down").onclick=()=>move(i,1);
    n.querySelector(".remove").onclick=()=>{config.macroList.splice(i,1);if(activeStepId===step.id)activeStepId=null;render();};
    n.querySelector(".source-meta").textContent=step.apgSource?JSON.stringify({recordStart:step.apgSource.recordStart,recordCount:step.apgSource.recordCount,possibleDelayMs:step.apgSource.possibleDelayMs},null,2):"新建步骤：没有原始 APG 记录范围。";
    host.append(n);
  });
  const active=config.macroList.find(step=>step.id===activeStepId&&!step.isBlankDelay),editor=$("stepEditor");
  if(active){editor.classList.remove("hidden");$("activeStepTitle").textContent="当前编辑："+(config.macroList.indexOf(active)+1)+". 动作步骤";renderButtonEditor(active);renderStickEditor(active);}
  else editor.classList.add("hidden");
}
$("fileName").onchange=()=>config.fileName=$("fileName").value.trim()||"macro";
$("addAction").onclick=()=>{const step=createActionStep({id:newId()});config.macroList.push(step);activeStepId=step.id;render();};
$("addBlank").onclick=()=>{config.macroList.push(createBlankDelayStep({id:newId()}));render();};
$("clearSteps").onclick=()=>{config.macroList=[];activeStepId=null;render();status("宏列表已清空。");};
$("newConfig").onclick=()=>{config={fileName:"macro",version:"1.0",macroList:[]};activeStepId=null;importedModel=null;originalBytes=null;$("recordCount").value="";$("layout").value="SWITCH";$("sourceInfo").textContent="已新建宏。导出时自动使用官方 APG 容器规则。";render();status("已创建新宏。");};
$("jsonFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{config=normalizeMacroConfig(JSON.parse(await f.text()));importedModel=null;originalBytes=null;$("layout").value="SWITCH";$("sourceInfo").textContent="JSON 已加载。APG 导出会按照官方通用序列化规则生成，不限制步骤数量；Marker、Counter 和尾部填充均自动处理。JSON 本身不包含 ABXY 布局信息，默认使用与官方样本一致的 Switch 布局，可在上方切换。";render();status("JSON 导入成功；可以直接导出 APG（支持任意步骤数）。");}catch(x){status("JSON 导入失败：无法解析文件，请确认 JSON 内容和格式正确。",true);}e.target.value="";};
$("apgFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{originalBytes=new Uint8Array(await f.arrayBuffer());const count=$("recordCount").value.trim(),opts={abxyLayout:$("layout").value,fileName:f.name.replace(/\.[^.]+$/,""),...(count?{recordCount:Number(count)}:{autoDetectRecordCount:true})};importedModel=apgToEditableModel(originalBytes,opts);config=normalizeMacroConfig(importedModel.config);$("recordCount").value=importedModel.source.recordCount;$("sourceInfo").textContent="APG 记录："+importedModel.source.recordCount+"；推断步骤："+config.macroList.length+"\n"+importedModel.warnings.map(localizeWarning).join("\n");render();status("APG 导入完成。请核对推断步骤和延时范围。");}catch(x){importedModel=null;originalBytes=null;status("APG 导入失败："+localizeError(x.message)+"。如果自动检测结果不明确，请手动填写记录数。",true);}e.target.value="";};
$("exportJson").onclick=()=>{try{config.fileName=base();download(base()+".json",new TextEncoder().encode(exportMacroJson(publicConfig())),"application/json");status("JSON 导出完成。");}catch(x){status("JSON 导出失败："+x.message,true);}};
$("exportApg").onclick=()=>{try{config.fileName=base();const layout=$("layout").value;let r;if(importedModel&&originalBytes)r=rebuildAPGFromEditableModel(originalBytes,importedModel,config,{abxyLayout:layout});else r=encodeAPG(config,{abxyLayout:layout});download(base()+".apg",r.data,"application/octet-stream");const p=r.plan,summary=p?("原始保留 "+p.preservedStepIds.length+" 步；重新编码 "+p.regeneratedStepIds.length+" 步；删除 "+p.removedStepIds.length+" 步。\n"):"JSON / 新建模式：所有步骤均重新编码。\n";status("APG 导出完成。\n"+summary+(r.truncated?"警告：超出 1 MiB APG 容量，部分后续记录未写入。\n":"")+(r.counterDiscontinuities?.length?"Counter 不连续："+r.counterDiscontinuities.length+" 处。\n":"")+(r.suffixPreservedBytes!==undefined?"保留尾部字节："+r.suffixPreservedBytes:""));}catch(x){status("APG 导出失败："+x.message,true);}};
render();