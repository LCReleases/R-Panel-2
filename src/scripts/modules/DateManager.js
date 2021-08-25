const twoChar = (i) => {
  return `0${i}`.slice(-2);
};

exports.formatDate = (seconds) => {
  if (seconds) {
    const datevalues = {};
    const timestamp = seconds;

    date = new Date(timestamp);

    datevalues.hours = twoChar(date.getHours());
    datevalues.minutes = twoChar(date.getMinutes());
    datevalues.seconds = twoChar(date.getSeconds());
    datevalues.year = date.getFullYear();
    datevalues.month = twoChar(date.getMonth() + 1);
    datevalues.day = twoChar(date.getDate());

    return `${datevalues.day}/${datevalues.month}/${datevalues.year} ${datevalues.hours}:${datevalues.minutes}:${datevalues.seconds}`;
  } else {
    return `Nenhum`;
  }
};

exports.parseTimestampToDay = (timestamp) => {
  if (timestamp) {
    const datevalues = {};

    date = new Date(timestamp);
    datevalues.day = twoChar(date.getDate());

    return datevalues.day;
  }
};

exports.parseTimestampToMonth = (timestamp) => {
  if (timestamp) {
    const datevalues = {};

    date = new Date(timestamp);
    datevalues.day = twoChar(date.getMonth());

    return datevalues.day;
  }
};

exports.parseTimestampToDayNumber = (timestamp) => {
  if (timestamp) {
    const datevalues = {};

    date = new Date(timestamp);
    datevalues.day = date.getDay();

    return datevalues.day;
  }
};


exports.parseTimestampToHours = (timestamp) => {
  if (timestamp) {
    const datevalues = {};

    date = new Date(timestamp);
    datevalues.hours = twoChar(date.getHours());

    return datevalues.hours;
  }
};
