const nameFormatter = (name) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
export default nameFormatter;
