export function applyPlaceholders(template = '', memberOrUser, guild) {
  const user = memberOrUser?.user || memberOrUser;
  const displayName = memberOrUser?.displayName || user?.globalName || user?.username || 'Unknown';

  return String(template)
    .replaceAll('{user}', user ? `<@${user.id}>` : displayName)
    .replaceAll('{username}', user?.username || displayName)
    .replaceAll('{nickname}', displayName)
    .replaceAll('{id}', user?.id || 'unknown')
    .replaceAll('{server}', guild?.name || 'server')
    .replaceAll('{memberCount}', String(guild?.memberCount || 0));
}
