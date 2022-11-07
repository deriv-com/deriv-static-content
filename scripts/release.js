const { exec } = require("child_process");

const log = (err) => {
  console.log(err);
};

const getToday = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = today.getFullYear();

  return `${yyyy}${mm}${dd}`;
};

const isValidTag = (tag) => /^production_V\d{8}_\d/.test(tag);

const generateNextTag = (tag) => {
  const today = `V${getToday()}`;
  const tag_chunks = tag.split("_");
  const last_date = tag_chunks[1];
  const last_version = parseInt(tag_chunks[2]);

  let new_version = 0;
  const final_date = last_date !== today ? today : last_date;

  if (last_date === today) {
    new_version = last_version + 1;
  }

  return `production_${final_date}_${new_version}`;
};

const getLatestTag = (tags) => {
  const today = `V${getToday()}`;
  let latest_version = 0;
  let latest_tag = null;

  tags.forEach((tag) => {
    const tag_chunks = tag.split("_");
    const date = tag_chunks[1];
    const version = parseInt(tag_chunks[2]);

    if (date === today) {
      if (latest_version < version || latest_version === 0) {
        latest_version = version;
        latest_tag = tag;
      }
    }
  });

  return latest_tag;
};

exec("git fetch", (err, stdout) => {
  exec("git tag -l", (err, stdout) => {
    if (err) {
      log(err);
      return;
    }

    const tags = stdout.split("\n");

    const latest_tag = getLatestTag(tags);

    if (isValidTag(stdout)) {
      log(`Latest Production tag: ${latest_tag}`);
      const new_tag = generateNextTag(latest_tag);

      exec(`git tag ${new_tag}`, (err, stdout) => {
        exec(`git push origin ${new_tag}`, (err, stdout) => {
          log(`${new_tag} has been pushed`);
        });
      });
    } else {
      log("Latest tag is not a production tag!");
    }
  });
});
