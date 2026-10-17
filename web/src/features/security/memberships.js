export function membershipRows(users,groups,groupKey=''){
 const byKey=new Map(groups.map(group=>[group.key,group]));
 return users.map(user=>{
  const manual=new Set(user.manual_groups||[]),effective=new Set(user.groups||[]);
  const keys=[...new Set([...manual,...effective])];
  const relevant=groupKey?keys.filter(key=>key===groupKey):keys;
  if(groupKey&&!relevant.length)return null;
  const names=relevant.map(key=>byKey.get(key)?.label||key);
  return {...user,id:user.id,name:user.name,groupNames:names.join(' · ')||'Chưa gán nhóm',origin:!relevant.length?'Chưa gán':relevant.map(key=>(byKey.get(key)?.label||key)+': '+(manual.has(key)?'Gán trực tiếp':'Theo tổ chức')+(byKey.get(key)?.enabled===false?' (nhóm tạm ngưng)':'')).join(' · '),status:user.enabled?'Hoạt động':'Tạm ngưng'};
 }).filter(Boolean);
}
