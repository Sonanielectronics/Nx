var {
  User,
  PurchaseShare,
  Share,
  Category,
  NxRecord,
  NxAdminRecord,
  Request,
} = require("../model/Schema");
const HTTP = require("../../constant/response.constant");

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

const { ObjectId } = require("mongodb");

var {
  getRandomNumber,
  generate1Day,
  generateLast5WorkingDays,
  GetPrevious1M,
  get1Y,
  convertToISO,
  getNextWorkingDay,
  countObjectsByKeyCount,
  UpdateAsPerWorkingDay
} = require("../Function/Function");

class class1 {
  static SignUp = async (req, res) => {
    try {
      if (
        req.body.Name &&
        req.body.Phone &&
        req.body.Email &&
        req.body.Password &&
        req.body.ReferralCode
      ) {
        let data = new User({
          Name: req.body.Name,
          Email: req.body.Email,
          Phone: req.body.Phone,
          Password: req.body.Password,
          OTP: "",
          Wallet: 0,
          AccountActivationCode: req.body.ReferralCode,
          AccountType: "User",
        });

        data
          .save()
          .then(async (savedUser) => {
            const ExistingUserId = req.body.ReferralCode.substring(0, 24);
            const ExistingShareId = req.body.ReferralCode.substring(
              req.body.ReferralCode.length - 24
            );

            var ExistingUser = await User.findOne({
              _id: new ObjectId(ExistingUserId),
            });

            if (ExistingUser.AccountType == "User") {
              const Record = await Share.find({
                _id: ExistingShareId,
              });

              let PurchaseSharedata = new PurchaseShare({
                User: new ObjectId(ExistingUserId),
                Share: new ObjectId(ExistingShareId),
                CategoryId: new ObjectId(Record[0].CategoryId),
                Quantity: 1,
                PurchsePrice: Record[0].Price,
                PurchaseType: "Free Purchase",
              });

              await PurchaseSharedata.save();
            }

            var a = {
              message: "User Create Successfully",
              status: `${HTTP.SUCCESS}`,
            };
            res.status(HTTP.SUCCESS).json(a);
          })
          .catch(async (err) => {
            res.send(err);
          });
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static SignIn = async (req, res) => {
    try {
      if (req.body.Name && req.body.Password) {
        var UserExist = await User.findOne({
          Name: req.body.Name,
        });

        if (UserExist) {
          var Passwordmatch = await bcrypt.compare(
            req.body.Password,
            UserExist.Password
          );

          if (Passwordmatch) {
            const Token = jwt.sign(
              { Name: req.body.Name },
              process.env.JWT_SECRET
            );

            var a = {
              message: "Login Successfully",
              User: UserExist,
              Token: Token,
              status: `${HTTP.SUCCESS}`,
              error: false,
            };
            res.status(HTTP.SUCCESS).json(a);
          } else {
            var a = {
              message: "Wrong PassWord",
              status: `${HTTP.UNAUTHORIZED}`,
            };
            res.status(HTTP.SUCCESS).json(a);
          }
        } else {
          var a = { message: "User Not Exist", status: `${HTTP.NOT_FOUND}` };
          res.status(HTTP.SUCCESS).json(a);
        }
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static SetShare = async (req, res) => {
    try {
      if (
        req.body.Name &&
        req.body.Price &&
        req.body.Time &&
        req.body.Parents
      ) {
        var ShareExist = await Share.findOne({
          Name: req.body.Name,
        });

        if (!ShareExist) {
          let today = new Date(); // Current date

          today.setDate(today.getDate() + 1);
          let nextWorkingDay =
          today.toLocaleDateString("en-GB");

          // let nextWorkingDay =
          //   getNextWorkingDay(today).toLocaleDateString("en-GB");

          var SinleDayData = await generate1Day(req.body.Price);
          
          var YearDataArray = await get1Y(SinleDayData[SinleDayData.length - 1].value,req.body.Price);
          var YearData = await YearDataArray.slice(-YearDataArray.length + 1);
          
          await YearData.push({
            time: nextWorkingDay,
            value: SinleDayData[SinleDayData.length - 1].value,
          });

          var MonthDataAray = await GetPrevious1M(req.body.Price);
          var MonthData = YearData.slice(-MonthDataAray.length - 1);

          var FiveDayData = YearData.slice(-7);

          var PriceData = [SinleDayData, FiveDayData, MonthData, YearData];

          var FormattedLaunchTime = await convertToISO(YearData[0].time);

          let data = new Share({
            Name: req.body.Name,
            Price: YearData[YearData.length - 1].value,
            LaunchTime: FormattedLaunchTime,
            CategoryId: req.body.Parents,
            Investment: 0,
            PriceData: PriceData,
          });

          await data.save();

          var a = {
            message: "Share Launch Successfully",
            status: `${HTTP.SUCCESS}`,
          };
          res.status(HTTP.SUCCESS).json(a);
        } else {
          var a = {
            message: "Share Already Exist",
            code: `${HTTP.CONFLICT}`,
          };
          res.status(HTTP.CONFLICT).json(a);
        }
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static PurchaseCurrency = async (req, res) => {
    try {
      if (
        req.body.UpdatedAmount !== undefined &&
        req.body.Name &&
        req.body.Time
      ) {
        await User.findOneAndUpdate(
          {
            Name: req.body.Name,
          },
          {
            Wallet: req.body.UpdatedAmount,
          }
        );

        var a = {
          message: "Currency Update Successfully",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static PurchaseShare = async (req, res) => {
    try {
      if (
        req.body.ShareId &&
        req.body.Quantity &&
        req.body.UserId &&
        req.body.PurchaseType
      ) {
        var ShareExist = await Share.findOne({
          _id: req.body.ShareId,
        });

        if (ShareExist) {
          var UserExist = await User.findOne({
            _id: req.body.UserId,
            AccountType: "User",
          });

          if (!UserExist) {
            var a = { message: "User Not Exist", status: `${HTTP.NOT_FOUND}` };
            res.status(HTTP.NOT_FOUND).json(a);
          }

          let data = new PurchaseShare({
            User: new ObjectId(req.body.UserId),
            Share: new ObjectId(req.body.ShareId),
            CategoryId: new ObjectId(ShareExist.CategoryId),
            Quantity: req.body.Quantity,
            PurchsePrice: req.body.PurchsePrice,
            PurchaseType: req.body.PurchaseType,
          });

          await data.save();

          var a = {
            message: "Share Purchase Successfully",
            status: `${HTTP.SUCCESS}`,
          };
          res.status(HTTP.SUCCESS).json(a);
        } else {
          var a = { message: "Share Not Exist", status: `${HTTP.NOT_FOUND}` };
          res.status(HTTP.NOT_FOUND).json(a);
        }
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static CheckReferralCodeStatus = async (req, res) => {
    try {
      if (req.body.SendingReferralCode !== undefined) {
        var UserAndShareExist = true;

        var ReferredBy;
        var ReferralCode;

        if (
          typeof req.body.SendingReferralCode === "string" &&
          req.body.SendingReferralCode.length === 48
        ) {
          const ExistingUserId = req.body.SendingReferralCode.substring(0, 24);
          const ExistingShareId = req.body.SendingReferralCode.substring(
            req.body.SendingReferralCode.length - 24
          );

          var UserExist = await User.findOne({
            _id: ExistingUserId,
          });

          var ShareExist = await Share.findOne({
            _id: ExistingShareId,
          });

          if (UserExist && ShareExist) {
            ReferredBy = UserExist._id;
            ReferralCode = ShareExist._id;
          } else {
            var AdminUser = await User.findOne({
              AccountType: "Admin",
            });

            ReferredBy = AdminUser._id;
            ReferralCode = AdminUser._id;

            UserAndShareExist = false;
          }
        } else {
          var UserExist = await User.findOne({
            AccountType: "Admin",
          });

          ReferredBy = UserExist._id;
          ReferralCode = UserExist._id;
        }

        var a = {
          message: "Referral Code Verified Successfully",
          ReferralCode: ReferralCode,
          ReferredBy: ReferredBy,
          UserAndShareExist: UserAndShareExist,
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static UserStatus = async (req, res) => {
    try {
      if (req.body.AccountActivationCode) {
        var UserArray = await User.find({
          AccountActivationCode: req.body.AccountActivationCode,
        });

        var a = {
          data: UserArray,
          message: "User Capture Successfully",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static GetPurchaseShare = async (req, res) => {
    try {
      if (req.body.UserId && req.body.ShareId) {
        var AllPurchaseShare = await PurchaseShare.find({
          User: req.body.UserId,
          Share: req.body.ShareId,
        });

        var a = {
          data: AllPurchaseShare,
          message: "Phuchase Share Capture Successfully",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static GetAllPurchaseShare = async (req, res) => {
    try {
      if (req.body.UserId) {
        var AllPurchaseShare = await PurchaseShare.find({
          User: req.body.UserId,
        });

        var a = {
          data: AllPurchaseShare,
          message: "Phuchase Share Capture Successfully",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static AllShare = async (req, res) => {
    try {
      var AllShare = await Share.find({
        Name: { $ne: "" },
      });

      var a = {
        data: AllShare,
        message: "Phuchase Share Capture Successfully",
        status: `${HTTP.SUCCESS}`,
      };
      res.status(HTTP.SUCCESS).json(a);
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static GetShare = async (req, res) => {
    try {
      if (req.body._id) {
        var ShareData = await Share.find({
          _id: req.body._id,
        });

        var a = {
          data: ShareData,
          message: "Share Capture Successfully",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static MToNx = async (req, res) => {
    try {
      if (
        req.body.Amount &&
        req.body.Status &&
        req.body.TransferId &&
        req.body.User
      ) {
        var IdExist = await NxRecord.findOne({
          TransferId: req.body.TransferId,
        });

        if (!IdExist) {
          let data = new NxRecord({
            Amount: req.body.Amount,
            Status: req.body.Status,
            TransferId: req.body.TransferId,
            User: req.body.User,
            IsChecked: "No",
          });

          data.save();

          var a = {
            message: "Request Add Successfully",
            status: `${HTTP.SUCCESS}`,
          };
          res.status(HTTP.SUCCESS).json(a);
        } else {
          var a = {
            message: "Id Already Use",
            code: `${HTTP.CONFLICT}`,
          };
          res.status(HTTP.CONFLICT).json(a);
        }
      } else {
        var a = {
          message: "Insufficient Data 2",
          status: `${HTTP.BAD_REQUEST}`,
        };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static NxAdminRecord = async (req, res) => {
    try {
      if (req.body.Amount && req.body.TransferId) {
        var IdExist = await NxAdminRecord.findOne({
          TransferId: req.body.TransferId,
        });

        if (!IdExist) {
          let data = new NxAdminRecord({
            Amount: req.body.Amount,
            TransferId: req.body.TransferId,
          });

          data.save();

          var a = {
            message: "Request Add Successfully",
            status: `${HTTP.SUCCESS}`,
          };
          res.status(HTTP.SUCCESS).json(a);
        } else {
          var a = {
            message: "Id Already Use",
            code: `${HTTP.CONFLICT}`,
          };
          res.status(HTTP.CONFLICT).json(a);
        }
      } else {
        var a = {
          message: "Insufficient Data",
          status: `${HTTP.BAD_REQUEST}`,
        };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static GetNxAdminRecord = async (req, res) => {
    try {
      var AllNxAdminRecord = await NxAdminRecord.find({
        IsVerified: "No",
      });

      var a = {
        data: AllNxAdminRecord,
        message: "Nx Admin record Capture Successfully",
        status: `${HTTP.SUCCESS}`,
      };
      res.status(HTTP.SUCCESS).json(a);
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static GetNxRecord = async (req, res) => {
    try {
      if (req.body.User) {
        var AllNxRecord = await NxRecord.find({
          User: req.body.User,
        });

        var a = {
          data: AllNxRecord,
          message: "Nx Admin record Capture Successfully",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static UserSettlement = async (req, res) => {
    try {
      if (req.body.User && req.body.Amount) {
        var UserRecord = await NxRecord.find({
          IsChecked: "No",
          User: req.body.User,
          Status: "Deposit",
        });

        var ConditionCheck = true;
        for (var i = 0; i < UserRecord.length; i++) {
          var FindQuery = {
            Amount: UserRecord[i].Amount,
            TransferId: UserRecord[i].TransferId,
            IsVerified: "No",
          };

          var AdminRecord = await NxAdminRecord.findOne(FindQuery);

          if (AdminRecord) {
            AdminRecord.IsVerified = "Yes";
            AdminRecord.save();

            UserRecord[i].IsChecked = "Yes";
          } else {
            var AllTransferIdFind = await NxAdminRecord.findOne({
              TransferId: UserRecord[i].TransferId,
            });

            var TransferIdFind = await NxAdminRecord.findOne({
              TransferId: UserRecord[i].TransferId,
              IsVerified: "Yes",
            });

            if (!AllTransferIdFind) {
              UserRecord[i].Note = "Wrong TransferId";
            } else if (TransferIdFind) {
              UserRecord[i].Note = "TransferId Already Use";
            } else {
              UserRecord[i].Note = "Wrong Amount";
            }

            ConditionCheck = false;
          }

          UserRecord[i].save();
        }

        if (ConditionCheck) {
          let data = new Request({
            Amount: req.body.Amount,
            User: req.body.User,
          });

          data.save();
        }

        var a = {
          ConditionCheck: ConditionCheck,
          message: "Request Add Successfully",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static UserWithdrawal = async (req, res) => {
    try {
      var UserWithdrawal = await NxRecord.find({
        Status: "Withdraw",
      });

      var Data = [];
      for (var i = 0; i < UserWithdrawal.length; i++) {
        var ExistingUser = await User.findOne({
          _id: new ObjectId(UserWithdrawal[i].User),
        });

        var PushData = {
          Amount: UserWithdrawal[i].Amount,
          Name: ExistingUser.Name,
        };

        await Data.push(PushData);
      }

      var a = {
        UserWithdrawal: Data,
        message: "Request Add Successfully",
        status: `${HTTP.SUCCESS}`,
      };
      res.status(HTTP.SUCCESS).json(a);
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static SendOTP = async (req, res) => {
    try {
      if (req.body.Name) {
        var OTP = Math.floor(100000 + Math.random() * 899999);

        await User.findOneAndUpdate(
          {
            Name: req.body.Name,
          },
          {
            OTP: OTP,
          }
        );

        var a = {
          message: "OTP Sent Successfully",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);
      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }
    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static VerifyOTP = async (req, res) => {
    try {

      if (req.body.Name && req.body.OTP && req.body.Password) {
        
        var UserExist = await User.findOne({
          Name: req.body.Name,
        });

        if (UserExist) {

          if (UserExist.OTP == req.body.OTP) {

            var NewPassWord = await bcrypt.hash(req.body.Password, 10);

            await User.findOneAndUpdate(
              {
                Name: req.body.Name,
              },
              {
                OTP: "",
                Password: NewPassWord,
              }
            );

            var a = {
              message: "Password Change Successfully",
              status: `${HTTP.SUCCESS}`,
              error: false,
            };
            res.status(HTTP.SUCCESS).json(a);

          } else {

            var a = {
              message: "Wrong OTP",
              status: `${HTTP.UNAUTHORIZED}`,
            };
            res.status(HTTP.SUCCESS).json(a);

          }
        } else {
          var a = { message: "User Not Exist", status: `${HTTP.NOT_FOUND}` };
          res.status(HTTP.SUCCESS).json(a);
        }

      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }

    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
  static UserWithdrawCom = async (req, res) => {
    try {

      if (req.body._id) {
        
        const Record = await Share.findOne({
          Name: "",
        });

        var Data = [];

        var DateArray = Record.PriceData[2];

        var [Lastday, Lastmonth, Lastyear] = DateArray[DateArray.length - 1].time.split("/");
  
        if(Lastday < 10 && Lastday.length == 1){
          Lastday = "0" + Lastday
        }

        if(Lastmonth < 10 && Lastmonth.length == 1){
          Lastmonth = "0" + Lastmonth
        }

        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-GB");

        if(formattedDate !== `${Lastday}/${Lastmonth}/${Lastyear}`){
          DateArray.push({ time: formattedDate, value: 0 })
        }

        for(var i=0;i<DateArray.length;i++){

          var [day, month, year] = DateArray[i].time.split("/");

          if(day < 10 && day.length == 1){
            day = "0" + day
          }

          if(month < 10 && month.length == 1){
            month = "0" + month
          }
          
          const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
          const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

          const WithDrawRecord = await NxRecord.find({createdAt : { $gte: startOfDay, $lte: endOfDay },Status: "Withdraw",});
          
          var UserWithdrawal = 0;
          var TotleWithdrawal = 0;

          for(var j=0;j<WithDrawRecord.length;j++){

            TotleWithdrawal = TotleWithdrawal + WithDrawRecord[j].Amount

            if(WithDrawRecord[j].User == req.body._id){
              UserWithdrawal = UserWithdrawal + WithDrawRecord[j].Amount
            }

          }

          var ExistingUser = await User.findOne({
            _id: new ObjectId(req.body._id),
          });

          if (ExistingUser.createdAt <= new Date(year, month - 1, day, 23, 59, 59)) {
            
            var PushElement = {
              time : DateArray[i].time,
              value : UserWithdrawal,
              value2 : TotleWithdrawal
            }

          } else {
            
            var PushElement = {
              time : DateArray[i].time,
              value2 : TotleWithdrawal
            }

          }

          await Data.push(PushElement);
          
        }
        
        // const result = await countObjectsByKeyCount(Data);
        
        // var ReceivedData
        // if(result.count3Keys > 2){
        //   var ReceivedData = await UpdateAsPerWorkingDay(Data);
        // }else if(result.count3Keys > 1){

        //   var LastElementDate = await Data[Data.length - 1].time.split("/");

        //   var LastElementDateDay 
        //   if(LastElementDate[0].length == 1){
        //     LastElementDateDay = `0${LastElementDate[0]}`
        //   }else{
        //     LastElementDateDay = LastElementDate[0]
        //   }

        //   var LastElementDateMonth 
        //   if(LastElementDate[1].length == 1){
        //     LastElementDateMonth = `0${LastElementDate[1]}`
        //   }else{
        //     LastElementDateMonth = LastElementDate[1]
        //   }

        //   var CheckingDate = new Date(LastElementDate[2], LastElementDateMonth - 1, LastElementDateDay) 

        //   if(CheckingDate.getDay() === 0){
        //     let SendData = Data.slice(0, Data.length - 2);
        //     var ReceivedData = await UpdateAsPerWorkingDay(SendData);
        //     await ReceivedData.push(Data[Data.length - 1])
        //   }else{
        //     var ReceivedData = await UpdateAsPerWorkingDay(Data);
        //   }

        // }else{
        //   let SendData = Data.slice(0, Data.length - 1);
        //   var ReceivedData = await UpdateAsPerWorkingDay(SendData);
        //   await ReceivedData.push(Data[Data.length - 1])
        // }

        // var a = {
        //   data: ReceivedData,
        //   message: "User Withdraw Comparison Record Send Successfully ww",
        //   status: `${HTTP.SUCCESS}`,
        // };
        // res.status(HTTP.SUCCESS).json(a);

        var a = {
          data: Data,
          message: "User Withdraw Comparison Record Send Successfully ww",
          status: `${HTTP.SUCCESS}`,
        };
        res.status(HTTP.SUCCESS).json(a);

      } else {
        var a = { message: "Insufficient Data", status: `${HTTP.BAD_REQUEST}` };
        res.status(HTTP.BAD_REQUEST).json(a);
      }

    } catch (e) {
      console.log(e);

      var a = { message: `${e}`, status: `${HTTP.INTERNAL_SERVER_ERROR}` };
      res.status(HTTP.INTERNAL_SERVER_ERROR).json(a);
    }
  };
}

module.exports = { class1 };