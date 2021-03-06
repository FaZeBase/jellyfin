define(["loading", "dom", "globalize", "humanedate", "paper-icon-button-light", "cardStyle", "emby-linkbutton", "indicators", "flexStyles"], function(loading, dom, globalize) {
    "use strict";

    function deleteUser(page, id) {
        var msg = globalize.translate("DeleteUserConfirmation");
        require(["confirm"], function(confirm) {
            confirm({
                title: globalize.translate("DeleteUser"),
                text: msg,
                confirmText: globalize.translate("ButtonDelete"),
                primary: "cancel"
            }).then(function() {
                loading.show(), ApiClient.deleteUser(id).then(function() {
                    loadData(page)
                })
            })
        })
    }

    function showUserMenu(elem) {
        var card = dom.parentWithClass(elem, "card"),
            page = dom.parentWithClass(card, "page"),
            userId = card.getAttribute("data-userid"),
            menuItems = [];
        menuItems.push({
            name: globalize.translate("ButtonOpen"),
            id: "open",
            ironIcon: "mode-edit"
        }), menuItems.push({
            name: globalize.translate("ButtonLibraryAccess"),
            id: "access",
            ironIcon: "lock"
        }), menuItems.push({
            name: globalize.translate("ButtonParentalControl"),
            id: "parentalcontrol",
            ironIcon: "person"
        }), menuItems.push({
            name: globalize.translate("ButtonDelete"),
            id: "delete",
            ironIcon: "delete"
        }), require(["actionsheet"], function(actionsheet) {
            actionsheet.show({
                items: menuItems,
                positionTo: card,
                callback: function(id) {
                    switch (id) {
                        case "open":
                            Dashboard.navigate("useredit.html?userId=" + userId);
                            break;
                        case "access":
                            Dashboard.navigate("userlibraryaccess.html?userId=" + userId);
                            break;
                        case "parentalcontrol":
                            Dashboard.navigate("userparentalcontrol.html?userId=" + userId);
                            break;
                        case "delete":
                            deleteUser(page, userId)
                    }
                }
            })
        })
    }

    function getUserHtml(user, addConnectIndicator) {
        var html = "",
            cssClass = "card squareCard scalableCard squareCard-scalable";
        user.Policy.IsDisabled && (cssClass += " grayscale"), html += "<div data-userid='" + user.Id + "' class='" + cssClass + "'>", html += '<div class="cardBox visualCardBox">', html += '<div class="cardScalable visualCardBox-cardScalable">', html += '<div class="cardPadder cardPadder-square"></div>', html += '<a is="emby-linkbutton" class="cardContent" href="useredit.html?userId=' + user.Id + '">';
        var imgUrl;
        user.PrimaryImageTag && (imgUrl = ApiClient.getUserImageUrl(user.Id, {
            width: 300,
            tag: user.PrimaryImageTag,
            type: "Primary"
        }));
        var imageClass = "cardImage";
        user.Policy.IsDisabled && (imageClass += " disabledUser"), imgUrl ? html += '<div class="' + imageClass + '" style="background-image:url(\'' + imgUrl + "');\">" : (html += '<div class="' + imageClass + ' flex align-items-center justify-content-center">', html += '<i class="md-icon cardImageIcon">person</i>'), user.ConnectUserId && addConnectIndicator && (html += '<div class="cardIndicators squareCardIndicators"><div title="' + globalize.translate("TooltipLinkedToEmbyConnect") + '" class="playedIndicator indicator"><i class="md-icon indicatorIcon">cloud</i></div></div>'), html += "</div>", html += "</a>", html += "</div>", html += '<div class="cardFooter visualCardBox-cardFooter">', html += '<div class="cardText flex align-items-center">', html += '<div class="flex-grow" style="overflow:hidden;text-overflow:ellipsis;">', html += user.Name, html += "</div>", html += '<button type="button" is="paper-icon-button-light" class="btnUserMenu flex-shrink-zero"><i class="md-icon">more_horiz</i></button>', html += "</div>", html += '<div class="cardText cardText-secondary">';
        var lastSeen = getLastSeenText(user.LastActivityDate);
        return html += "" != lastSeen ? lastSeen : "&nbsp;", html += "</div>", html += "</div>", html += "</div>", html += "</div>"
    }

    function getLastSeenText(lastActivityDate) {
        return lastActivityDate ? "Last seen " + humane_date(lastActivityDate) : ""
    }

    function getUserSectionHtml(users, addConnectIndicator) {
        var html = "";
        return html += users.map(function(u) {
            return getUserHtml(u, addConnectIndicator)
        }).join("")
    }

    function renderUsers(page, users) {
        page.querySelector(".localUsers").innerHTML = getUserSectionHtml(users, !0)
    }

    function showPendingUserMenu(elem) {
        var menuItems = [];
        menuItems.push({
            name: globalize.translate("ButtonCancel"),
            id: "delete",
            ironIcon: "delete"
        }), require(["actionsheet"], function(actionsheet) {
            var card = dom.parentWithClass(elem, "card"),
                page = dom.parentWithClass(card, "page"),
                id = card.getAttribute("data-id");
            actionsheet.show({
                items: menuItems,
                positionTo: card,
                callback: function(menuItemId) {
                    switch (menuItemId) {
                        case "delete":
                            cancelAuthorization(page, id)
                    }
                }
            })
        })
    }

    function getPendingUserHtml(user) {
        var html = "";
        html += "<div data-id='" + user.Id + "' class='card squareCard scalableCard squareCard-scalable'>", html += '<div class="cardBox cardBox-bottompadded visualCardBox">', html += '<div class="cardScalable visualCardBox-cardScalable">', html += '<div class="cardPadder cardPadder-square"></div>';
        return html += '<a class="cardContent cardImageContainer" is="emby-linkbutton" href="#">', user.ImageUrl ? (html += '<div class="cardImage" style="background-image:url(\'' + user.ImageUrl + "');\">", html += "</div>") : html += '<i class="cardImageIcon md-icon">&#xE7FD;</i>', html += "</a>", html += "</div>", html += '<div class="cardFooter visualCardBox-cardFooter">', html += '<div class="cardText" style="text-align:right; float:right;padding:0;">', html += '<button type="button" is="paper-icon-button-light" class="btnUserMenu"><i class="md-icon">more_horiz</i></button>', html += "</div>", html += '<div class="cardText" style="padding-top:10px;padding-bottom:10px;">', html += user.UserName, html += "</div>", html += "</div>", html += "</div>", html += "</div>"
    }

    function renderPendingGuests(page, users) {
        users.length ? page.querySelector(".sectionPendingGuests").classList.remove("hide") : page.querySelector(".sectionPendingGuests").classList.add("hide");
        var html = users.map(getPendingUserHtml).join("");
        page.querySelector(".pending").innerHTML = html
    }

    function cancelAuthorization(page, id) {
        loading.show(), ApiClient.ajax({
            type: "DELETE",
            url: ApiClient.getUrl("Connect/Pending", {
                Id: id
            })
        }).then(function() {
            loadData(page)
        })
    }

    function loadData(page) {
        loading.show(), ApiClient.getUsers().then(function(users) {
            renderUsers(page, users), loading.hide()
        }), ApiClient.getJSON(ApiClient.getUrl("Connect/Pending")).then(function(pending) {
            renderPendingGuests(page, pending)
        })
    }

    function showLinkUser(page, userId) {
        require(["components/guestinviter/connectlink"], function(connectlink) {
            connectlink.show().then(function() {
                loadData(page)
            })
        })
    }

    function showInvitePopup(page) {
        Dashboard.getCurrentUser().then(function(user) {
            if (!user.ConnectUserId) return void showLinkUser(page, user.Id);
            require(["components/guestinviter/guestinviter"], function(guestinviter) {
                guestinviter.show().then(function() {
                    loadData(page)
                })
            })
        })
    }

    function showNewUserDialog(e) {
        require(["dialog"], function(dialog) {
            var items = [];
            items.push({
                name: globalize.translate("HeaderAddLocalUser"),
                id: "manual",
                type: "submit",
                description: globalize.translate("AddUserByManually")
            }), items.push({
                name: globalize.translate("HeaderInviteWithEmbyConnect"),
                id: "invite",
                description: globalize.translate("InviteAnEmbyConnectUser")
            }), items.push({
                name: globalize.translate("sharedcomponents#ButtonCancel"),
                id: "cancel",
                type: "cancel"
            });
            var options = {
                title: globalize.translate("ButtonAddUser"),
                text: globalize.translate("HowWouldYouLikeToAddUser")
            };
            return options.buttons = items, dialog(options).then(function(result) {
                var view = dom.parentWithClass(e.target, "page");
                "invite" === result ? showInvitePopup(view) : "manual" === result && Dashboard.navigate("usernew.html")
            })
        })
    }
    pageIdOn("pageinit", "userProfilesPage", function() {
        var page = this;
        page.querySelector(".btnAddUser").addEventListener("click", showNewUserDialog), page.querySelector(".localUsers").addEventListener("click", function(e) {
            var btnUserMenu = dom.parentWithClass(e.target, "btnUserMenu");
            btnUserMenu && showUserMenu(btnUserMenu)
        }), page.querySelector(".pending").addEventListener("click", function(e) {
            var btnUserMenu = dom.parentWithClass(e.target, "btnUserMenu");
            btnUserMenu && showPendingUserMenu(btnUserMenu)
        })
    }), pageIdOn("pagebeforeshow", "userProfilesPage", function() {
        loadData(this)
    })
});