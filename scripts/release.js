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

exec("git fetch", (err, stdout) => {
  exec(
    "git describe --tags `git rev-list --tags --max-count=1`",
    (err, stdout) => {
      if (err) {
        log(err);
        return;
      }

      if (isValidTag(stdout)) {
        log(`Latest Production tag: ${stdout}`);
        const new_tag = generateNextTag(stdout);

        exec(`git tag ${new_tag}`, (err, stdout) => {
          exec(`git push origin ${new_tag}`, (err, stdout) => {
            log(`${new_tag} has been pushed`);
          });
        });
      } else {
        log("Latest tag is not a production tag!");
      }
    }
  );
});
