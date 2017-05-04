using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Akutjournalen.Controllers
{
    public class IDPInfoController : Controller
    {        
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "IDP";            
            @ViewBag.SubPageHeader = "";            
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
	}
}