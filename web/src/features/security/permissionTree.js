import { navigation } from '../../app/navigation';
import { navigationGroups } from '../../app/navigationGroups';
export const actionLabels = { view:'Xem danh sách / chi tiết', create:'Thêm mới', update:'Chỉnh sửa', delete:'Xóa', import:'Nhập dữ liệu', export:'Xuất dữ liệu', approve:'Phê duyệt', publish:'Xuất bản', take:'Làm bài thi', run:'Luyện tập' };
export const bindings = {
 learning:['learning','Xem khóa học và nội dung bài học'], exams:['exams','Xem kỳ thi, ca thi và vào phòng chờ'], practice:['practice','Thiết lập và làm bài luyện tập'], knowledge:['knowledge','Tra cứu tài liệu và kiến thức'],
 'manage-questions':['questions','Thư mục, câu hỏi, nhập câu hỏi và duyệt nội dung'], 'manage-assessments':['assessments','Đăng ký bộ đề, chọn câu hỏi và xuất bản'], 'manage-blueprints':['blueprints','Ma trận đề, điểm đạt và cấu hình luyện tập'], 'manage-levels':['exam_levels','Cơ chế thi và chính sách cấp độ'], 'manage-exams':['exam_management','Tổ chức kỳ thi, ca thi và đối tượng tham gia'], 'manage-grading':['grading','Hàng đợi và chi tiết chấm bài'], 'manage-groups':['training_groups','Quản lý lớp và nhóm học'], 'manage-reports':['reports','Theo dõi và xuất báo cáo đào tạo'], 'admin-users':['users','Tài khoản, tổ chức và nhóm quyền'], 'admin-modules':['modules','Đăng ký module và chức năng'], 'admin-catalog':['catalog','Đăng ký danh mục nghiệp vụ dùng chung']
};
export const expectedActions = {
 learning:['view','create','update','delete','import','export','publish'],exams:['view'],practice:['view','run'],knowledge:['view'],questions:['view','create','update','delete','import','export','approve'],assessments:['view','create','update','publish'],blueprints:['view','update'],exam_levels:['view','update'],exam_management:['view','create','update'],grading:['view','update'],training_groups:['view','create','update'],reports:['view','export'],users:['view','create','update'],modules:['view','create','update','delete','import','export'],catalog:['view','create','update']
};
export const moduleScreens = {
 learning:[['Khóa học','/app/learning','Danh sách khóa học'],['Bài học','/app/learning/:courseId/lessons/:lessonId','Nội dung bài học']],
 exams:[['Danh sách kỳ thi','/app/exams','Kỳ thi được giao'],['Chi tiết kỳ thi','/app/exams/:examId','Thông tin kỳ thi'],['Phòng chờ','/app/exams/:examId/lobby','Kiểm tra thông tin trước khi thi']],
 practice:[['Thiết lập luyện tập','/app/practice','Chọn nội dung và cấu hình luyện tập'],['Làm bài luyện tập','/app/practice/player','Trả lời câu hỏi luyện tập']],
 questions:[['Thư mục & Danh sách câu hỏi','/manage/questions','Duyệt thư mục và câu hỏi'],['Thêm câu hỏi','/manage/questions/new','Đăng ký câu hỏi'],['Chỉnh sửa câu hỏi','/manage/questions/:id/edit','Chi tiết, sửa nội dung'],['Nhập câu hỏi','/manage/questions','Hộp thoại nhập hàng loạt']],
 assessments:[['Danh sách bộ đề','/manage/assessments','Quản lý bộ đề'],['Đăng ký bộ đề','/manage/assessments/new','Đối tượng, ngôn ngữ và câu hỏi'],['Chi tiết bộ đề','/manage/assessments/:id','Ma trận, xem trước và xuất bản']],
 users:[['Tài khoản','/admin/users','Tab tài khoản và đăng ký người dùng'],['Nhóm quyền','/admin/users','Tab nhóm quyền và điều kiện tự động'],['Tổ chức & Vai trò','/admin/users','Tab danh mục tổ chức']],
 modules:[['Menu & Chức năng','/admin/modules','Bảng phân cấp chức năng'],['Đăng ký module','/admin/modules','Tab đăng ký module và quyền'],['Nhóm quyền & Thành viên','/admin/modules','Tab nhóm quyền, mẫu và gán hàng loạt']],
 catalog:[['Cấp bậc','/admin/catalog','Tab cấp bậc'],['Phòng ban','/admin/catalog','Tab phòng ban'],['Vị trí / Nhóm đối tượng','/admin/catalog','Tab vị trí'],['Vai trò nghiệp vụ','/admin/catalog','Tab vai trò'],['Ngôn ngữ','/admin/catalog','Tab ngôn ngữ'],['Cấp độ ISA-95','/admin/catalog','Tab cấp độ']],
 grading:[['Hàng đợi chấm bài','/manage/grading','Danh sách bài cần chấm'],['Chi tiết chấm bài','/manage/grading/:submissionId','Chấm điểm và nhận xét']],
 exam_management:[['Danh sách ca thi','/manage/exams','Tổ chức kỳ thi và ca thi']],
};
export function permissionBranches(modules) {
 const used = new Set();
 const branches = navigationGroups.map(group => ({ ...group, children: group.items.map(id => {
   const item = navigation.find(item => item.id === id), binding = bindings[id];
   if (!item || !binding) return null;
   const module = modules.find(module => module.key === binding[0]);

   used.add(binding[0]);
   return { key:binding[0], label:item.label, actions:expectedActions[binding[0]]||['view'], enabled:false, ...module, registered:!!module, route:item.path, description:binding[1] };
 }).filter(Boolean) }));
 branches.push({id:'personal',label:'Chung & Cá nhân',children:[
 {key:'dashboard',label:'Tổng quan',route:'/app',description:'Trang tổng quan',actions:[],enabled:true,personal:true},
 {key:'settings',label:'Cài đặt cá nhân',route:'/app/settings',description:'Hồ sơ cá nhân · Hiển thị & Múi giờ · Nhật ký hoạt động của tôi',actions:[],enabled:true,personal:true},
 {key:'notifications',label:'Thông báo',route:'/notifications',description:'Trung tâm thông báo',actions:[],enabled:true,personal:true}
 ]});
 const extras = modules.filter(module => !used.has(module.key)).map(module => ({ ...module, route: module.key === 'permissions' ? '/admin/modules' : '', description: module.key === 'permissions' ? 'Tạo nhóm quyền, gán thành viên và cấp quyền trực tiếp' : module.key === 'attempts' ? 'Vào phòng thi, làm bài và nộp bài' : 'Chức năng được đăng ký trong hệ thống' }));
 if (extras.length) branches.push({id:'other',label:'Chức năng bổ sung',children:extras});
 return branches.filter(branch => branch.children.length);
}
export function mergePermissionTargets(targets) {
 const result=new Map();
 for(const target of targets){const previous=result.get(target.key);result.set(target.key,{...target,actions:[...new Set([...(previous?.actions||[]),...target.actions])]});}
 return [...result.values()];
}
export function setBranchPermissions(current, modules, checked) {
 let result=current.map(permission=>({...permission,actions:[...permission.actions]}));
 for(const module of mergePermissionTargets(modules).filter(module=>module.enabled&&module.registered!==false&&!module.personal)){
  const previous=result.find(permission=>permission.module===module.key)?.actions||[];
  let actions=checked?[...new Set([...previous,...module.actions,...(module.actions.some(action=>action!=='view')?['view']:[])])]:previous.filter(action=>!module.actions.includes(action));
  if(!checked&&module.actions.includes('view'))actions=[];
  result=result.filter(permission=>permission.module!==module.key);if(actions.length)result.push({module:module.key,actions});
 }
 return result;
}
export function toggleTreeAction(current, module, action, checked) {
 const prior = current.find(permission=>permission.module===module)?.actions || [];
 let actions = checked ? [...new Set([...prior, action, ...(action !== 'view' ? ['view'] : [])])] : action === 'view' ? [] : prior.filter(value=>value!==action);
 return [...current.filter(permission=>permission.module!==module), ...(actions.length?[{module,actions}]:[])];
}
export function learnerPreset(modules) {
 const allowed = {learning:['view'], exams:['view'], attempts:['view','take'], practice:['view','run'], knowledge:['view']};
 return modules.filter(module=>module.enabled && allowed[module.key]).map(module=>({module:module.key,actions:module.actions.filter(action=>allowed[module.key].includes(action))})).filter(permission=>permission.actions.length);
}

// Business modules are presentation parents; scope keys remain stable API references.
export function permissionHierarchy(modules) {
 const inventory=permissionBranches(modules).flatMap(branch=>branch.children);
 const scopes=new Map(inventory.map(scope=>[scope.key,scope]));
 const mapped=new Set();
 const actionSets={
 questions:[['view'],['create'],['view','update'],['view','import']],
 assessments:[['view'],['create'],['view','update','publish']],
 learning:[['view'],['view']],exams:[['view'],['view'],['view']],practice:[['view'],['run']],
 grading:[['view'],['view','update']],users:[['view','create','update'],[],['view','update']],
 modules:[['view'],['view','create','update','delete','import','export'],[]]
 };
 const leaf=(scope,actions,id)=>actions.map(action=>({id:id+':'+action,name:actionLabels[action]||action,kind:'Quyền thao tác',route:scope.key+':'+action,description:'Quyền của chức năng '+scope.label,status:scope.personal?'Mọi tài khoản':scope.registered===false?'Chưa đăng ký':scope.enabled?'Hoạt động':'Tạm ngưng',module:scope,action,children:[],targets:[{...scope,actions:[action]}]}));
 const menu=(key,parent)=>{
  const scope=scopes.get(key);if(!scope)return null;mapped.add(key);
  const id=parent+':menu:'+key;
  const definitions=moduleScreens[key]||[['Quản lý '+scope.label,scope.route||'',scope.description]];
  const children=definitions.map((definition,index)=>{
   let target=scope;
   if((key==='users'&&index===1)||(key==='modules'&&index===2)){target=scopes.get('permissions')||{key:'permissions',label:'Nhóm quyền & Thành viên',actions:['view','update'],registered:false,enabled:false};mapped.add('permissions')}
   const wanted=target!==scope?target.actions:(actionSets[key]?.[index]||scope.actions);
   const actions=wanted.filter(action=>target.actions.includes(action));
   const functionId=id+':function:'+index;
   return {id:functionId,name:definition[0],kind:'Chức năng',route:definition[1],description:definition[2],status:scope.personal?'Mọi tài khoản':target.registered===false?'Chưa đăng ký':target.enabled?'Hoạt động':'Tạm ngưng',children:leaf(target,actions,functionId),targets:actions.length?[{...target,actions}]:[]};
  });
  const represented=new Set(children.flatMap(child=>child.targets.filter(target=>target.key===key).flatMap(target=>target.actions)));
  const remaining=scope.actions.filter(action=>!represented.has(action));
  if(remaining.length){const functionId=id+':function:management';children.push({id:functionId,name:'Quản lý '+scope.label,kind:'Chức năng',route:scope.route||key,description:scope.description,status:scope.registered===false?'Chưa đăng ký':scope.enabled?'Hoạt động':'Tạm ngưng',children:leaf(scope,remaining,functionId),targets:[{...scope,actions:remaining}]})}
  return {id,name:scope.label,kind:'Menu / Màn hình',route:scope.route||key,description:scope.description,status:scope.personal?'Mọi tài khoản':scope.registered===false?'Chưa đăng ký':scope.enabled?'Hoạt động':'Tạm ngưng',children,targets:mergePermissionTargets(children.flatMap(child=>child.targets))};
 };
 const group=(id,name,keys)=>{const children=keys.map(key=>menu(key,id)).filter(Boolean);return {id,name,kind:'Nhóm menu',route:'',description:children.map(child=>child.name).join(' · '),status:'',children,targets:mergePermissionTargets(children.flatMap(child=>child.targets))}};
 const root=(id,name,groups)=>({id,name,kind:'Module',route:'',description:groups.map(group=>group.name).join(' · '),status:'',children:groups,targets:mergePermissionTargets(groups.flatMap(group=>group.targets))});
 const roots=[
  root('training','Đào tạo',[
   group('training:learning','Học tập',['learning','exams','practice','knowledge','attempts']),
   group('training:assessment','Quản lý đánh giá',['questions','assessments','blueprints','exam_levels']),
   group('training:organization','Tổ chức thi & Chấm bài',['exam_management','grading','training_groups']),
   group('training:reports','Báo cáo đào tạo',['reports'])
  ]),
  root('system','Hệ thống',[
   group('system:security','Tài khoản & Phân quyền',['users','modules']),
   group('system:catalog','Danh mục nghiệp vụ',['catalog'])
  ]),
  root('personal','Chung & Cá nhân',[group('personal:utilities','Tiện ích cá nhân',['dashboard','settings','notifications'])])
 ];
 const extras=inventory.filter(scope=>!mapped.has(scope.key));if(extras.length)roots.push(root('extensions','Mở rộng',[group('extensions:registered','Chức năng đã đăng ký',extras.map(scope=>scope.key))]));
 return roots;
}
export function flattenPermissionHierarchy(nodes,path=[]) {
 return nodes.flatMap(node=>[{...node,path:[...path,node.id],breadcrumbs:[...path]},...flattenPermissionHierarchy(node.children,[...path,node.id])]);
}

export function hydratePermissionHierarchy(modules,nodes){
 if(!nodes?.length)return permissionHierarchy(modules);
 const scopes=new Map(permissionBranches(modules).flatMap(branch=>branch.children).map(scope=>[scope.key,scope]));
 const make=record=>{
  const scope=record.scope_key?(scopes.get(record.scope_key)||{key:record.scope_key,label:record.scope_key,actions:[],enabled:false,registered:false}):null;
  const supported=scope&&scope.actions.includes(record.action);
  const children=nodes.filter(node=>node.parent_id===record.id).map(make);
  const target=scope?{...scope,actions:supported?[record.action]:[],enabled:scope.enabled&&supported}:null;
  return {id:record.id,name:record.label,kind:record.kind,route:record.route,description:record.description,children,targets:target?[target]:mergePermissionTargets(children.flatMap(child=>child.targets)),...(target?{module:target,action:record.action}:{}),status:target?(scope.personal?'Mọi tài khoản':!supported||scope.registered===false?'Chưa đăng ký':scope.enabled?'Hoạt động':'Tạm ngưng'):record.id.startsWith('personal')?'Mọi tài khoản':''};
 };
 const roots=nodes.filter(node=>!node.parent_id).map(make);
 const known=new Set(nodes.map(node=>node.scope_key).filter(Boolean));
 const extra=permissionHierarchy(modules).find(root=>root.id==='extensions');if(extra){extra.children=extra.children.map(group=>({...group,children:group.children.filter(menu=>!menu.targets.every(target=>known.has(target.key)))})).filter(group=>group.children.length);if(extra.children.length)roots.push(extra)}
 return roots;
}
