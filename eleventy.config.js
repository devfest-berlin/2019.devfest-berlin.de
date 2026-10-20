module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "images": "images" });
  eleventyConfig.addPassthroughCopy({ "site/css": "css" });

  const tagColors = {
    "android": "#32de84",
    "i-os": "#007aff",
    "ios": "#007aff",
    "mobile": "#000000",
    "web": "#2196f3",
    "go": "#00acd7",
    "machine-learning": "#ff6f00",
    "machine learning": "#ff6f00",
    "ml": "#ff6f00",
    "kubernetes": "#326CE5",
    "database": "#336791",
    "diversity": "#e91e63",
    "career": "#dddd00",
    "marketing": "#ff0000",
    "programming": "#424242",
    "microservice": "#1488C6",
    "microservices": "#1488C6",
    "software-design": "#f24e1e",
    "software design": "#f24e1e",
    "cloud": "#00B0ff",
    "gde": "#3d5afe",
    "wtm": "#1de9b6",
    "gdg": "#00B0ff",
    "general": "#673AB7"
  };

  eleventyConfig.addFilter("tagColor", function(tag) {
    if (!tag) return "#673AB7";
    const key = tag.toLowerCase().trim().replace(/\s+/g, "-");
    return tagColors[key] || tagColors[tag.toLowerCase().trim()] || "#673AB7";
  });

  eleventyConfig.addFilter("split", function(str, delim) {
    if (!str) return [];
    return str.split(delim);
  });

  eleventyConfig.addFilter("sliceText", function(arr, start, end) {
    if (!Array.isArray(arr)) return arr;
    return arr.slice(start, end);
  });

  eleventyConfig.addLayoutAlias("base", "layouts/base.njk");

  return {
    dir: {
      input: "site",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
