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
using Goliat.Models;

namespace Goliat.Controllers
{
    public class InkommandeController : Controller
    {


        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Inkommande remisser";
            @ViewBag.SubPageHeader = "Urologkliniken";            
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "";        
        }

        public ActionResult Index()
        {
            return View();
        }

        // Get all the underlag posts. Connected to MongoDB.
        [HttpPost]
        public JsonResult GetUnderlag()
        {
            MongoClient _client;
            var jsonSerialiser = new JavaScriptSerializer();

            List<object> underlag_list = new List<object>();

            _client = new MongoClient("mongodb://s-opbokt1.lio.se:9000");
            var database = _client.GetDatabase("Goliat");
            var collection = database.GetCollection<UnderlagModel>("Underlag").AsQueryable<UnderlagModel>();

            var query =
            from e in collection.AsQueryable<UnderlagModel>()
            select e;

            foreach (var underlag in query)
            {
                var temp = jsonSerialiser.Serialize(underlag);
                underlag_list.Add((object)underlag);
            }

            var json = jsonSerialiser.Serialize(underlag_list);

            return Json(json);
        }

        // Creation of Underlag posts. Connected to MongoDB.
        [HttpPost]
        public JsonResult CreateUnderlag(UnderlagModel model)
        {
            MongoClient _client;

            _client = new MongoClient("mongodb://s-opbokt1.lio.se:9000");
            var database = _client.GetDatabase("Goliat");

            var collection = database.GetCollection<UnderlagModel>("Underlag");

            collection.InsertOne(model);
            
            return Json(model);
        }
	}
}


