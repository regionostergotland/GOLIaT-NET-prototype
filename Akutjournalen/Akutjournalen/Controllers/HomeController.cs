using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Goliat.Controllers
{
    public class HomeController : Controller
    {
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Översikt";
            @ViewBag.SubPageHeader = "Urologkliniken";            
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";
            @ViewBag.PageUserRoll = ""; 
            
        }

        public ActionResult Index()
        {
            
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}