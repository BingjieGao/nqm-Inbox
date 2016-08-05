/**
 * Created by toby on 19/10/15.
 */
//
// var emails = [
//  {id:0, folder:1, name: "Alex Stern", email: "alex@spam.com", subject:"Invitation", date: "25/07/2013 12:30:20"},
//  {id:2, folder:1, name: "Sofia O'Neal", email: "sofia@spam.com", subject:"Report", date: "25/07/2013 16:10:07"},
//  {id:3, folder:1, name: "Jacob Erickson", email: "jacob@spam.com", subject:"Go ahead, make my day", date: "26/07/2013 11:25:50"},
//  {id:4, folder:1, name: "Alice", email: "alice@spam.com", subject:"Confirmation request", date: "26/07/2013 15:28:46"},
//  {id:6, folder:1, name: "Sofia O'Neal", email: "sofia@spam.com", subject:"Re: Details for Ticket 256", date: "30/07/2013 17:10:17"},
//  {id:5, folder:1, name: "Alex Stern", email: "alex@spam.com", subject:"Requested info", date: "30/07/2013 12:58:20"},
//  {id:7, folder:1, name: "Jacob Erickson", email: "jacob@spam.com", subject:"Urgent", date: "28/07/2013 09:02:11"},
//  {id:11, folder:2, name: "Alex Stern", email: "alex@spam.com", subject:"Re: Forecast", date: "25/07/2013 14:10:45"},
//  {id:12, folder:2, name: "Sofia O'Neal", email: "sofia@spam.com", subject:"Party invitation", date: "25/07/2013 17:05:10"}
// ];
//

function send() {
  var new_message = $$("mailform").getValues();
  var new_content = $$("mail-content").getValue();
  new_content = {html:new_content};
  console.log(new_content);
  //webix.message(new_message, null, 2);
  webix.ajax().post("/send",{message:new_message,content:new_content},function(text,data,xmlHttpRequest){
    console.log(text);
    console.log(xmlHttpRequest);
    if(xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200){
      $$('popupwin').close();
      webix.message('sent success',null,10);
    }
  })
}
var ui = { rows:[
  {
    type: "space",
    rows:[
      {
        view: "toolbar", height: 45, elements:[
        {view: "label", label: "<span style='font-size: 18px;'>SECD Email Manager</span>"},
        {view:"icon", id:"id_settings",icon:"cog",popup:"setwindow"}
      ]
      },
      {
        type:"wide", cols:[
        {
          type: "clean",
          rows:[
            { view:"button", id: "id_create", type: "iconButton", label:"Create", icon:"envelope", width: 95 },
            {
              view:"tree",
              css: "rounded_top",
              select: true,
              width:280,
              type:{
                folder:function(obj){
                  return "<img src='common/tree/"+obj.icon+".png' style='position:relative; top:2px; left:-2px;'>";
                }
              },
              data:[
                { id:"1", value:"Inbox", icon:"inbox"},
                { id:"2", value:"Sent", icon:"sent"},
                { id:"3", value:"Drafts", icon:"drafts"},
                { id:"4", value:"Trash", icon:"trash"},
                { id:"5", value:"Contact Groups", open:true, icon:"folder", data:[
                  { id:"5-1", value:"Friends", icon:"file"},
                  { id:"5-2", value:"Blocked", icon:"file"}
                ]
                }
              ]
            },
            {
              view: "calendar", css: "rounded_bottom"
            }
          ]

        },
        { type:"wide",rows:[
          { view:"datatable",css: "rounded_top", scrollX:false, columns:[
            { id:"ch1", header:{ content:"masterCheckbox" }, template:"{common.checkbox()}",checkValue:'on', uncheckValue:'off', css:"center", width: 40 },
            { id:"id", width: 100, header:"Id" },
            { id:"from", width: 250, header:"From" },
            { id:"subject", header:"Subject", fillspace:true },
            { id:"date", header:"Date", width: 150 }
          ], select:"row", data: gData, ready:function(){
            console.log(gData);
            //webix.delay(function(){
            //this.select(2); //defalut select the first one
            //},this);
          }},
          { height: 45, cols:[
            { view:"button", id: "id_reply", type: "icon",  label:"Reply", icon:"reply", width: 95, hidden: true},
            { view:"button", id: "id_replyall", type: "icon", label:"Reply All", icon:"reply-all", width: 100, hidden: false },
            { view:"button", id: "id_delete", type: "icon", label:"Delete", icon:"times", width: 95 },
            {},
            { view:"button", id: "id_prev", type: "icon", icon: "angle-double-left", width: 30 },
            { view:"button", id: "id_next", type: "icon", icon: "angle-double-right", width: 30 }
          ]},
          {view:"template", id: "mailview", scroll:"y", template:"No message available"}
        ]}
      ]


      }
    ]
  }
]};
var popup = {
  view:"window",
  width:700,
  left:50, top:50,
  move:true,
  id:"popupwin",
  head:{
    view:"toolbar", cols:[
      {view:"label", label: "New Message" },
      { view:"button", label: 'Close', width: 90, align: 'right', click:"$$('popupwin').close();"}
    ]
  },
  body:{
    view: "form",
    id:"mailform",
    elements: [
      {
        view: "text",
        name: "To",
        label: "To",
        labelWidth: "100"
      },
      {
        view: "text",
        name: "Cc",
        label: "Cc",
        labelWidth: "100"
      },
      {
        view: "text",
        name: "Subject",
        label: "Subject",
        labelWidth: "100"
      },
      {
        id:'mail-content',
        view:"tinymce-editor",
        height:150,
      },
      {
        margin:5,
        cols:[
          { view:"button", id:'id_cancel', value:"cancel",click:"$$('popupwin').close();"},
          { view:"button", value:"send" ,type:"form",click:send}
        ]
      }
    ]
  }
};
var settings = {
  view:"popup", id:"setwindow",
  head:false, width: 100,
  body:{
    view:"list", scroll:false,
    yCount:2, select:true, borderless:true,
    template:"#lang#",
    data:[
      {id:"id_set1", lang:"Logout"},
      {id:"id_set2", lang:"French"}
    ],
    on:{"onAfterSelect":function(){
      $$("setwindow").hide();
    }}
  }
};

webix.ready(function() {

  webix.ui(ui);
  webix.ui(settings);

  $$("$datatable1").bind($$("$tree1"),function(obj,filter){
    return obj.folder == filter.id;
  });

  $$("$datatable1").attachEvent("onAfterSelect",function(id){
    webix.ajax("/message?id="+gData[this.getItem(id).id-1].msgid, function(text) {
      $$("id_reply").show();
      $$("mailview").setHTML(text);
    });
  });

  $$('$datatable1').eachRow(function(id){
    if (this.getItem(id).ch1){
      webix.message(id+" is checked");
    }
  });

  $$("id_prev").attachEvent("onItemClick", function(id, e){
    webix.ajax("/page?id="+gData[$$("$datatable1").getSelectedId().id-1].id, function(text) {
      console.log(text);
    });
  });

  $$("id_next").attachEvent("onItemClick", function(id, e){
    webix.ajax("/page?id="+gData[$$("$datatable1").getSelectedId().id-1].nextpage, function(text) {
      console.log(text);
    });
  });

  $$("$tree1").select(1);

  /*
   * create email
   */
  $$("id_create").attachEvent("onItemClick",function(id,e){
    console.log('create clicked');
    webix.ui(popup).show();
  })
  /*
   * delete selected email
   */
  $$('id_delete').attachEvent('onItemClick',function(id,e){
    console.log(gData[$$('$datatable1').getSelectedId().id-1]);
    webix.ajax().del("/message?id="+gData[$$('$datatable1').getSelectedId().id-1].msgid,function(text, data, XmlHttpRequest){
      console.log('delete message'+text);
    })
  });

 });
