using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Json;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using Akutjournalen.Models;

namespace Akutjournalen.Controllers
{
    public class InkommandeController : Controller
    {


        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Inkommande";
            @ViewBag.SubPageHeader = "Urologkliniken";            
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "";        // Skall vi göra en session av denna eller en global class eller hanteras i bas controll, innehåll skall hantera vid login ?
        }
        //
        // GET: /Triage/
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public JsonResult GetUnderlag()
        {
            MongoClient _client;
            var jsonSerialiser = new JavaScriptSerializer();

            List<object> underlag_list = new List<object>();

            _client = new MongoClient("mongodb://localhost:27017");
            var database = _client.GetDatabase("Goliat");
            var collection = database.GetCollection<UnderlagModel>("Underlag").AsQueryable<UnderlagModel>();

            //var result = collection.AsQueryable<UnderlagModel>().Any();

            var query =
            from e in collection.AsQueryable<UnderlagModel>()
            select e;

            foreach (var underlag in query)
            {
                //var temp = JsonConvert.SerializeObject(underlag);
                var temp = jsonSerialiser.Serialize(underlag);
                underlag_list.Add((object)underlag);
            }

            var json = jsonSerialiser.Serialize(underlag_list);

            return Json(json);
        }


        [HttpPost]
        public JsonResult CreateUnderlag(UnderlagModel model)
        {
            MongoClient _client;

            _client = new MongoClient("mongodb://localhost:27017");
            var database = _client.GetDatabase("Goliat");

            var collection = database.GetCollection<UnderlagModel>("Underlag");

            collection.InsertOne(model);
            //try
            //{

            //}
            //catch (Exception e)
            //{
            //    Console.WriteLine(e.ToString());
            //}
            

            return Json(model);
        }

        

        //[HttpPost]
        //public JsonResult AjaxMethod(string id, string ehrid, string current_state, string firstname,
        //    string lastname, string gender, string personnummer, string start_date_countdown, string utredning_id,
        //    string filled_form_status)
        //{

        //    UnderlagModel underlag = new UnderlagModel
        //    {
        //        ID = id,
        //        ehrid = ehrid,
        //        current_state = current_state,
        //        firstname = firstname,
        //        lastname = lastname,
        //        gender = gender,
        //        personnummer = personnummer,
        //        start_date_countdown = start_date_countdown,
        //        utredning_id = utredning_id,
        //        filled_form_status = filled_form_status,

        //    };
        //    return Json(underlag);
        //}
	}
}


