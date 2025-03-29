var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");

const HTTP = require("../../constant/response.constant");
var { generate1Day , GetPrevious1M , get1Y , getNextWorkingDay } = require('../Function/Function');

const UserSchema = new mongoose.Schema({
  Name: { type: String, required: true, unique: true },
  Phone: { type: String, required: true },
  Email: { type: String, required: true },
  Password: { type: String, required: true },
  OTP:{  type: String, default: "" },
  Wallet: { type: Number, required: true },  
  AccountActivationCode: { type: String, required: true},
  AccountType: { type: String, default: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre("save", async function (next) {

  var IsExistUser = await mongoose.model("User").findOne({ Name: this.Name  });
  if(IsExistUser){
    return next({
      message : "User Already Exist",
      status: `${HTTP.CONFLICT}`
    });
  }

  if(this.AccountType == "User"){

      const AdminUser = await mongoose.model("User").findOne({ AccountType: "Admin" });

      var DefaultReferralCode = AdminUser._id.toString() + AdminUser._id.toString();

      if (this.AccountActivationCode !== DefaultReferralCode) {
  
        const existingUser = await mongoose.model("User").findOne({ AccountActivationCode: this.AccountActivationCode });
        if (existingUser) {
          return next({
            message : "Referral Code Expired",
            status: `${HTTP.Expired}`
          });
        }

      }
    
  }

  if (!this.isModified("Password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.Password = await bcrypt.hash(this.Password, salt);
    next();
  } catch (err) {
    next(err);
  }

});

var User = mongoose.model('User', UserSchema);

const ShareSchema = new mongoose.Schema({
  Name: { type: String , unique: true},
  Price: { type: Number, required: true },
  CategoryId : { type: mongoose.Schema.Types.ObjectId, required: true },
  LaunchTime: { type: Date,default: Date.now, required: true },
  Investment: { type: Number, required: true,default: 0 },
  PriceData : { type: Array, required: true,default: []  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

var Share = mongoose.model('Share', ShareSchema);

const PurchaseShareSchema = new mongoose.Schema({
  User: { type: mongoose.Schema.Types.ObjectId, required: true },
  Share: { type: mongoose.Schema.Types.ObjectId, required: true },
  CategoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
  Quantity: { type: Number, required: true },
  PurchsePrice: { type: Number, required: true },
  PurchaseType : { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

var PurchaseShare = mongoose.model('PurchaseShare', PurchaseShareSchema);

const CategorySchema = new mongoose.Schema({
  Type: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

var Category = mongoose.model('Category', CategorySchema);

const NxRecordSchema = new mongoose.Schema({
  Amount: { type: Number, required: true },
  Status: { type: String, required: true },
  TransferId: { type: String, required: true, unique: true },
  User: { type: mongoose.Schema.Types.ObjectId, required: true },
  IsChecked: { type: String, default: "No", required: true },
  Note: { type: String, default: ""  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

var NxRecord = mongoose.model('NxRecord', NxRecordSchema);

const NxAdminRecordSchema = new mongoose.Schema({
  Amount: { type: Number, required: true },
  TransferId: { type: String, required: true, unique: true },
  IsVerified: { type: String, required: true, default: "No" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

var NxAdminRecord = mongoose.model('NxAdminRecord', NxAdminRecordSchema);

const RequestSchema = new mongoose.Schema({
  Amount: { type: Number, required: true },
  User: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

var Request = mongoose.model('Request', RequestSchema);

Category.create({ 
  Type:"Reject"
}).then(CreatedCategory => {

  // Multiple Category Are Possible Like Oil & Gas Operations , Software & Programming ... Etc
  User.create({
    _id:CreatedCategory._id,  
    Name: 'Jay', 
    Phone: '9106871899', 
    Email: 'Jay@Gmail.com', 
    Password: "Jay@123", 
    OTP:"",
    Wallet:0,
    AccountActivationCode: CreatedCategory._id + CreatedCategory._id, 
    AccountType: 'Admin'
  }).then(async (CreatedUser) => {
        
    //  Create Like Software & Programming  Sector Inside Tata Consultancy Services ( Price 3,812.40 ) , Infosys ( Price 1,832.80 ) ... Etc 

    let today = new Date(); // Current date
    // let nextWorkingDay = getNextWorkingDay(today).toLocaleDateString("en-GB");
    
    today.setDate(today.getDate() + 1);

    let nextWorkingDay = today.toLocaleDateString("en-GB");

    var YearData = await get1Y(0,0);
    var YearData = await YearData.slice(-YearData.length + 1);
    await YearData.push({time:nextWorkingDay,value:0});

    var MonthDataOfficialArray = await GetPrevious1M(0);

    var MonthData = YearData.slice(-MonthDataOfficialArray.length -1);

    var FiveDayData = YearData.slice(-7);
    
    var SinleDayData = await generate1Day(0);

    var PriceData = [SinleDayData,FiveDayData,MonthData,YearData]

    var LunchingTime = YearData[0].time.split('/');

    let Day = Number(LunchingTime[0]) >= 10 ? LunchingTime[0] : `0${LunchingTime[0]}`;
    let Month = Number(LunchingTime[1]) >= 10 ? LunchingTime[1] : `0${LunchingTime[1]}`;

    let ITime = new Date(`${LunchingTime[2]}-${Month}-${Day}T00:00:00.000+00:00`);
    
    function formatDate(dateString) {
      const date = new Date(dateString);
      
      // Adding required offset (change this logic as per your needs)
      date.setFullYear(2025);
      date.setMonth(1); // February (months are zero-based)
      date.setDate(21);
      date.setHours(12, 25, 0, 398); // Setting hours, minutes, seconds, milliseconds
  
      // Convert to ISO string and format the required way
      const isoString = date.toISOString(); // e.g., "2025-02-21T12:25:00.398Z"
      
      // Convert "Z" to "+00:00"
      return isoString.replace("Z", "+00:00");
  }

    Share.create({ 
      _id:CreatedCategory._id, 
      Name: "", 
      Price: 0, 
      CategoryId: CreatedUser._id,
      LaunchTime: formatDate(ITime),
      Investment:0,
      PriceData:PriceData
    }).then(async (CreatedShare) => {

      var UpdatedMonthData = YearData.slice(-MonthDataOfficialArray.length -2) ;
      
      for(var i=0;i<UpdatedMonthData.length;i++){
        
        let Amount = Math.floor(Math.random() * 8) + 1; 

        var WithdrawalYear = UpdatedMonthData[i].time.split("/")[2]

        var WithdrawalMonth
        if(UpdatedMonthData[i].time.split("/")[1].length == 1){
          var WithdrawalMonthOriginal = UpdatedMonthData[i].time.split("/")[1]
          var WithdrawalMonth = `0${WithdrawalMonthOriginal}`
        }else{
          var WithdrawalMonth = UpdatedMonthData[i].time.split("/")[1]
        }

        var WithdrawalDate
        if(UpdatedMonthData[i].time.split("/")[0].length == 1){
          var WithdrawalDateOriginal = UpdatedMonthData[i].time.split("/")[0]
          var WithdrawalDate = `0${WithdrawalDateOriginal}`
        }else{
          var WithdrawalDate = UpdatedMonthData[i].time.split("/")[0]
        }

        const WithDrawalTime = new Date(WithdrawalYear, WithdrawalMonth - 1, WithdrawalDate, 12, 0, 0);
        WithDrawalTime.setDate(WithDrawalTime.getDate() + 1);

        let data = new NxRecord({
          Amount: Amount,
          Status: "Withdraw",
          TransferId: i,
          User: CreatedCategory._id,
          IsChecked: "Yes",
          createdAt:WithDrawalTime
        });
        
        await data.save();

      }

      console.log("Default Data Create")

    })

    
  })

}).catch(err => console.error('Default Data Already Exist'));

module.exports = { User , PurchaseShare , Share , Category , NxRecord , NxAdminRecord , Request };