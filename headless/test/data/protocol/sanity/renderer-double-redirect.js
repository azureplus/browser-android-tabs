// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(async function(testRunner) {
  let {page, session, dp} = await testRunner.startWithFrameControl(
      'Tests renderer: double redirection.');

  let RendererTestHelper =
      await testRunner.loadScript('../helpers/renderer-test-helper.js');
  let {httpInterceptor, frameNavigationHelper, virtualTimeController} =
      await (new RendererTestHelper(testRunner, dp, page)).init();

  // Two navigations have been scheduled while the document was loading, but
  // only the second one was started. It canceled the first one.
  httpInterceptor.addResponse('http://www.example.com/',
      `<html>
      <head>
        <title>Hello, World 1</title>
        <script>
          document.location='http://www.example.com/1';
          document.location='http://www.example.com/2';
        </script>
      </head>
      <body>http://www.example.com/1</body>
      </html>`);

  httpInterceptor.addResponse('http://www.example.com/2',
      '<p>Pass</p>');

  await virtualTimeController.grantInitialTime(1000, 1000,
    null,
    async () => {
      testRunner.log(await session.evaluate('document.body.innerHTML'));
      frameNavigationHelper.logFrames();
      frameNavigationHelper.logScheduledNavigations();
      testRunner.completeTest();
    }
  );

  await frameNavigationHelper.navigate('http://www.example.com/');
})
