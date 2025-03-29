const getNextWorkingDay = (date = new Date()) => {
  let nextDate = new Date(date);

  do {
    nextDate.setDate(nextDate.getDate() + 1);
  } while (nextDate.getDay() === 6 || nextDate.getDay() === 0); // 6 = Saturday, 0 = Sunday

  return nextDate;
};

function getRandomNumber(amount) {
  let max = amount * 0.03; // 2% of amount
  let min = -amount * 0.015; // 1% of amount (negative)

  var ReturnValue = Math.random() * (max - min) + min;
  return ReturnValue;
}

function isLastDayOfMonth() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return tomorrow.getDate() === 1;
}

function getLastDayOfLastMonth() {
  const now = new Date();
  const lastMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0);
  return lastMonthLastDay.getDate();
}

const generate1Day = async (IPrice) => {
  const startTime = new Date();
  startTime.setHours(9, 15, 0, 0); // Start at 09:15:00
  const endTime = new Date();
  endTime.setHours(15, 30, 0, 0); // End at 15:30:00
  const interval = 5 * 60 * 1000; // 1 minute in milliseconds
  const data = [];

  var Price = IPrice;

  for (
    let time = startTime;
    time <= endTime;
    time = new Date(time.getTime() + interval)
  ) {
    data.push({
      time: time.toLocaleTimeString("en-US", { hour12: true }),
      value: Price,
    });

    var generatedNumber = getRandomNumber(Price);
    const randomNumber = generatedNumber * (2 / 75);
    Price = Price + randomNumber;
  }

  return data;
};

const generateLast5WorkingDays = async (IPrice) => {
  const workingDays = [];
  const today = new Date();
  today.setDate(today.getDate() - 1); // Start from yesterday

  var Price = IPrice;

  while (workingDays.length < 5) {
    const day = today.getDay(); // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)

    // Check if the day is Monday to Friday
    if (day >= 1 && day <= 5) {
      const day = String(new Date(today).getDate()).padStart(2, "0"); // Ensure 2-digit day
      const month = String(new Date(today).getMonth() + 1).padStart(2, "0"); // Ensure 2-digit month
      const year = new Date(today).getFullYear();

      workingDays.push({ time: `${day}/${month}/${year}`, value: Price }); // Add the current date to the result

      const randomNumber = getRandomNumber(Price);
      Price = Price - randomNumber;
    }

    // Move to the previous day
    today.setDate(today.getDate() - 1);
  }

  return workingDays.reverse(); // Reverse the array to get dates in chronological order
};

const Get1M = async (IPrice) => {
  const end = new Date();
  const Month = end.getMonth() + 1;

  var daysInMonth;

  if (Month == 2) {
    if (end.getFullYear() % 4 === 0) {
      daysInMonth = 29;
    } else {
      daysInMonth = 28;
    }
  } else {
    if (
      Month == 0 ||
      Month == 1 ||
      Month == 3 ||
      Month == 5 ||
      Month == 7 ||
      Month == 8 ||
      Month == 10
    ) {
      daysInMonth = 31;
    } else {
      daysInMonth = 30;
    }
  }

  var Price = IPrice;

  const data = [];
  for (let i = 0; i < daysInMonth; i++) {
    const time = new Date(end);
    time.setDate(end.getDate() - i);

    data.unshift({ time: time.toLocaleDateString(), value: Price });

    const randomNumber = getRandomNumber(Price);
    Price = Price - randomNumber;
  }
  return data;
};

const GetPrevious1M = async (IPrice) => {
  const end = new Date();

  var daysInMonth;

  if (new Date().getDate() < getLastDayOfLastMonth()) {
    daysInMonth = getLastDayOfLastMonth();
  } else {
    daysInMonth = new Date().getDate();
  }

  var Price = IPrice;

  const data = [];
  for (let i = 0; i < daysInMonth; i++) {
    const time = new Date(end);
    time.setDate(end.getDate() - i);

    data.unshift({ time: time.toLocaleDateString(), value: Price });

    const randomNumber = getRandomNumber(Price);
    Price = Price - randomNumber;
  }

  return data;
};

const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

const get1Y = async (IPrice, IPrice2) => {
  const end = new Date(); // Today's dates

  var year;
  if (end.getMonth() < 2) {
    year = end.getFullYear() - 1;
  } else {
    year = end.getFullYear();
  }

  var Price = IPrice;

  const daysInYear = isLeapYear(year) ? 366 : 365; // Adjust days for leap year
  const data = [];

  for (let i = 0; i < daysInYear; i++) {
    const time = new Date(end);
    time.setDate(end.getDate() - i); // Subtract i days

    if (i == 1) {
      Price = IPrice2;
    } else if (time.getDay() === 0 || time.getDay() === 6) {
      Price = Price;
    } else {
      const randomNumber = getRandomNumber(Price);
      Price = Price - randomNumber;
    }

    data.unshift({ time: time.toLocaleDateString(), value: Price });
  }

  return data;
};

const convertToISO = async (dateStr, time = "12:25:01.555") => {
  // Split the input date
  const [day, month, year] = dateStr.split("/").map(Number);

  // Create a new Date object in UTC
  const date = new Date(Date.UTC(year, month - 1, day));

  // Extract the ISO date part
  const isoDatePart = date.toISOString().split("T")[0];

  // Construct the final format
  return `${isoDatePart}T${time}+00:00`;
};

async function isTimeInRange(now, currentHours, currentMinutes) {
  // Convert times to minutes for easier comparison
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  const startTimeInMinutes = 9 * 60 + 15; // 9:15 AM
  const endTimeInMinutes = 15 * 60 + 30; // 3:30 PM

  return (
    currentTimeInMinutes >= startTimeInMinutes &&
    currentTimeInMinutes <= endTimeInMinutes
  );
}

async function isDateInWeekEnd(today) {
  const day = today.getDay();

  if (day === 0 || day === 6) {
    return false;
  } else {
    return true;
  }
}

const generate1D = async (_id) => {
  var {
    User,
    PurchaseShare,
    Share,
    Category,
    NxRecord,
    NxAdminRecord,
    Request,
  } = require("../model/Schema");

  const Record = await Share.findOne({
    _id: _id,
  });

  const data = await Record.PriceData[0];

  return data;
};

const getLast5WorkingDays = async (_id) => {
  var {
    User,
    PurchaseShare,
    Share,
    Category,
    NxRecord,
    NxAdminRecord,
    Request,
  } = require("../model/Schema");

  const Record = await Share.findOne({
    _id: _id,
  });

  const data = await Record.PriceData[1];

  var receiveData = await UpdateAsPerWorkingDay(data);

  return receiveData;
};

const generate1M = async (_id) => {
  var {
    User,
    PurchaseShare,
    Share,
    Category,
    NxRecord,
    NxAdminRecord,
    Request,
  } = require("../model/Schema");

  const Record = await Share.findOne({
    _id: _id,
  });

  const data = await Record.PriceData[2];

  var receiveData = await UpdateAsPerWorkingDay(data);

  return receiveData;
};

const generate1Y = async (_id) => {
  var {
    User,
    PurchaseShare,
    Share,
    Category,
    NxRecord,
    NxAdminRecord,
    Request,
  } = require("../model/Schema");

  const Record = await Share.findOne({
    _id: _id,
  });

  const data = await Record.PriceData[3];

  var receiveData = await UpdateAsPerWorkingDay(data);

  return receiveData;
};

async function EmitFunction(now, hours, minutes,second) {

  console.log(`Emit Data Function Run At ${hours}:${minutes}`);

  var {
    User,
    PurchaseShare,
    Share,
    Category,
    NxRecord,
    NxAdminRecord,
    Request,
  } = require("../model/Schema");

  const { users } = require("../router/SocketRouter");

  var ValidTime = await isTimeInRange(now, hours, minutes);
  var ValidDay = await isDateInWeekEnd(now);

  // if (ValidTime && ValidDay) {

    console.log(`Emit Data Function FullFil Requirement`);

    let ClockSystem = 12 > hours ? "Am" : "Pm";

    const Record = await Category.find({});

    for (var i = 0; i < Record.length; i++) {

      const Record2 = await PurchaseShare.find({ CategoryId: Record[i]._id });

      if (Record2.length == 0) {

        const Record3 = await Share.find({ CategoryId: Record[i]._id });

        for (var j = 0; j < Record3.length; j++) {

          var PushHours;
          if (hours < 10 && hours.length == 1) {
            PushHours = `0${hours}`;
          } else if(hours > 12){
            PushHours = `0${hours - 12}`;
          } else {
            PushHours = hours;
          }

          var PushMinites;
          if (minutes < 10 && minutes.length == 1) {
            PushMinites = `0${minutes}`;
          } else {
            PushMinites = minutes;
          }

          var RecordArray = await Record3[j].PriceData[0];

          var PushElementArray = await RecordArray[RecordArray.length - 1]
            .value;

          var PushElement;
          if (hours == 9 && minutes == 15) {
            var PushElement = PushElementArray;
          } else {
            var Different = 2 * getRandomNumber(PushElementArray);
            var OfficialDifferent = Different / 75
  
            var PushElement = PushElementArray + OfficialDifferent;
          }

          // var PushElementValue = {
          //   time: `${PushHours}:${PushMinites}:00 ${ClockSystem}`,
          //   value: PushElement,
          // };

          var PushElementValue = {
            time: `${PushHours}:${PushMinites}:${second} ${ClockSystem}`,
            value: PushElement,
          };

          await RecordArray.push(PushElementValue);
          Record3[j].PriceData[0] = RecordArray.filter(
            (_, index) => index >= 1 && index <= RecordArray.length
          );

          if (hours == 15 && minutes == 30) {
            var LastPushElementValue = {
              time: `${now.toLocaleDateString("en-GB")}`,
              value: PushElement,
            };

            var RecordArray1 = await Record3[j].PriceData[1];
            var RecordArray2 = await Record3[j].PriceData[2];
            var RecordArray3 = await Record3[j].PriceData[3];

            await RecordArray1.push(LastPushElementValue);
            await RecordArray2.push(LastPushElementValue);
            await RecordArray3.push(LastPushElementValue);

            Record3[j].PriceData[1] = RecordArray1.filter(
              (_, index) => index >= 1 && index <= RecordArray1.length
            );
            Record3[j].PriceData[2] = RecordArray2.filter(
              (_, index) => index >= 1 && index <= RecordArray2.length
            );
            Record3[j].PriceData[3] = RecordArray3.filter(
              (_, index) => index >= 1 && index <= RecordArray3.length
            );
          }

          Record3[j].save();
        }

      }
    }

    console.log("Check");

    if (!users || typeof users !== "object") {
      console.error("Users object is not properly initialized!");
      return;
    }

    Object.entries(users).forEach(([key, sockets]) => {
      if (!sockets || typeof sockets !== "object") return;

      Object.keys(sockets).forEach(async (_id) => {
        const socket = sockets[_id];
        if (socket) {
          var data;
          if (key === "1D") {
            var data = await generate1D(_id);
          } else if (key === "5D") {
            var data = await getLast5WorkingDays(_id);
          } else if (key === "1M") {
            var data = await generate1M(_id);
          } else {
            var data = await generate1Y(_id);
          }

          socket.emit("updateChartData", data);
        }
      });
    });

    console.log("Check2");

  // }

}

async function fetchData(interval = 60000) {

  const date = new Date();
  const ISTOffset = 5.5 * 60 * 60 * 1000; 
  const ISTTime = new Date(date.getTime() + ISTOffset);

  const hours = ISTTime.getHours();
  const minutes = ISTTime.getMinutes();
  const second = ISTTime.getSeconds();

  console.log(`Fetch Data Run At ${hours}:${minutes}`);

  // if (interval == 300000) {
  //   EmitFunction(ISTTime, hours, minutes);
  // }

  // if (minutes == 0 || minutes == 5 || minutes == 10 || minutes == 15 || minutes == 20 || minutes == 25 || minutes == 30 || minutes == 35 || minutes == 40 || minutes == 45 || minutes == 50 || minutes == 55) {
  //   interval = 300000;
  // }

  if (interval == 5000) {
    EmitFunction(ISTTime, hours, minutes,second);
  }

  if (minutes == 0 || minutes == 5 || minutes == 10 || minutes == 15 || minutes == 20 || minutes == 25 || minutes == 30 || minutes == 35 || minutes == 40 || minutes == 45 || minutes == 50 || minutes == 55) {
    interval = 5000;
  }

  setTimeout(() => fetchData(interval), interval);
}

async function countObjectsByKeyCount(data) {
  let count2Keys = 0;
  let count3Keys = 0;

  // Loop through the JSON array
  data.forEach((item) => {
    const keyCount = Object.keys(item).length;

    if (keyCount === 2) {
      count2Keys++; // Increment count if there are 2 keys
    } else if (keyCount === 3) {
      count3Keys++; // Increment count if there are 3 keys
    }
  });

  return {
    count2Keys: count2Keys,
    count3Keys: count3Keys,
  };
}

async function UpdateAsPerWorkingDay(InitialArray) {
  var UpdatedData = [];
  for (var i = 0; i < InitialArray.length; i++) {
    var DateArray = InitialArray[i].time.split("/");

    var CheckDate;
    if (DateArray[0].length == 1) {
      CheckDate = `0${DateArray[0]}`;
    } else {
      CheckDate = DateArray[0];
    }

    var CheckMonth;
    if (DateArray[1].length == 1) {
      CheckMonth = `0${DateArray[1]}`;
    } else {
      CheckMonth = DateArray[1];
    }

    var CheckOriginalDate = `${DateArray[2]}-${CheckMonth}-${CheckDate}`;

    const ConvertedOriginalDate = new Date(CheckOriginalDate);
    const WorkingDay = ConvertedOriginalDate.getDay();

    if (WorkingDay >= 1 && WorkingDay <= 5) {
      await UpdatedData.push(InitialArray[i]);
    }
  }

  return UpdatedData;
}

module.exports = {
  getRandomNumber,
  generate1Day,
  generateLast5WorkingDays,
  Get1M,
  GetPrevious1M,
  get1Y,
  convertToISO,
  getNextWorkingDay,
  fetchData,
  countObjectsByKeyCount,
  UpdateAsPerWorkingDay,
  generate1D,
  getLast5WorkingDays,
  generate1M,
  generate1Y,
};
