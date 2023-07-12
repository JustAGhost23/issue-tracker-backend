export const extractUsernameFromEmail = (emailStr: string) => {
  if (!emailStr) {
    return "";
  } else {
    return emailStr.replace(/\./g, "").match(/([^@]+)/)![1];
  }
};
