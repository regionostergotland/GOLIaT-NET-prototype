using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Akutjournalen.Controllers
{
    public class PatienterController : Controller
    {
        // GET: Patienter
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult CreatePatient()
        {
            return View();
        }
    }
}