using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Akutjournalen.Controllers
{
    public class HomeController : Controller
    {
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Översikt";
            @ViewBag.SubPageHeader = "Urologkliniken";            
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";
            @ViewBag.PageUserRoll = "";        // Skall vi göra en session av denna eller en global class eller hanteras i bas controll, innehåll skall hantera vid login ?
            
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