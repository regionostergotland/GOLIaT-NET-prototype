using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Goliat.Controllers
{
    public class SlutAnteckningController : Controller
    {
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Ledningsvy";
            @ViewBag.SubPageHeader = "Urologkliniken";
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "";
        }

        // GET: SlutAnteckning
        public ActionResult Index()
        {
            return View();
        }
    }
}