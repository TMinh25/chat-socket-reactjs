import {
  Box,
  Button,
  ButtonGroup,
  Circle,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  ScaleFade,
  Tag,
  Text,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import { MdOutlinePowerSettingsNew } from "react-icons/md";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { ColorModeSwitcher } from "../../components/ColorModeSwitcher";
import { useSignOutMutation } from "../../features/auth/authApiSlice";
import { resetCredentials } from "../../features/auth/authSlice";
import { useAppState } from "../../hooks/useAppState";
import { useAuth } from "../../hooks/useAuth";
import TokenService from "../../services/token.service";
import { FcHome } from "react-icons/fc";
// import { chatSocket } from "../../features/chat/socketManager";

export default function LandingPage() {
  const location = useLocation();
  const { toast } = useAppState();
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const { authenticated, currentUser } = useAuth();
  const borderColor = useColorModeValue("white", "black.50");
  const borderColorTheme = useColorModeValue("gray.200", "gray.600");
  const [signOut, signOutResult] = useSignOutMutation();
  const signOutModal = useDisclosure();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut().unwrap();
      dispatch(resetCredentials());
      TokenService.updateLocalAccessToken(null);
      TokenService.updateLocalRefreshToken(null);
      // chatSocket.disconnect();
      signOutModal.onClose();
      navigate("/");
    } catch (error) {
      console.log({ error });
      toast({
        status: "error",
        title: (error as any).data?.message,
      });
    }
  }

  return (
    <ScaleFade key={location.pathname} initialScale={0.95} in={true}>
      <Flex direction="column" as="section" h="100vh" maxH="100vh">
        <Box
          flex="0 1 auto"
          as="nav"
          bg="bg-surface"
          boxShadow={useColorModeValue("sm", "sm-dark")}
          py={2}
          px={8}
        >
          {isDesktop ? (
            <Flex justify="space-between" align="center">
              <ButtonGroup variant="solid" spacing="4">
                <IconButton
                  icon={<Icon as={FcHome} />}
                  aria-label="nav-home-button"
                  as={RouterLink}
                  to="/"
                />
                {[
                  { href: "/message/all", label: "Tin Nhắn Chung" },
                  {
                    href: "/message/direct",
                    label: "Tin Nhắn Riêng",
                    disabled: true,
                  },
                ].map((item, index) => (
                  <Button
                    as={RouterLink}
                    to={item.disabled ? "#" : item.href}
                    key={index}
                    disabled={item.disabled}
                  >
                    {item.label}
                  </Button>
                ))}
              </ButtonGroup>
              {authenticated ? (
                <Popover>
                  <PopoverTrigger>
                    <Tag alignItems="center" cursor="pointer">
                      <Circle
                        size="3"
                        background="#31A24C"
                        mx={2}
                        border="2px solid"
                        borderColor={borderColor}
                      />
                      {currentUser?.displayName}
                    </Tag>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader fontWeight="semibold">
                      <Text align="center">{currentUser?.displayName}</Text>
                    </PopoverHeader>
                    <PopoverBody>
                      <HStack mb={4} mt={2} spacing={2}>
                        <ColorModeSwitcher />
                      </HStack>
                      <Button
                        w="full"
                        colorScheme="red"
                        onClick={() => signOutModal.onOpen()}
                      >
                        Đăng Xuất
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              ) : (
                <HStack spacing="3">
                  <Button variant="solid">Sign in</Button>
                  <Button variant="primary">Sign up</Button>
                </HStack>
              )}
            </Flex>
          ) : (
            <IconButton
              variant="ghost"
              icon={<FiMenu fontSize="1.25rem" />}
              aria-label="Open Menu"
            />
          )}
        </Box>
        <Divider />
        {authenticated && (
          <Modal isOpen={signOutModal.isOpen} onClose={signOutModal.onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalCloseButton />
              <ModalHeader>Đăng xuất</ModalHeader>
              <ModalBody>Bạn có chắc muốn đăng xuất?</ModalBody>
              <ModalFooter>
                <Button
                  colorScheme="red"
                  leftIcon={<Icon as={MdOutlinePowerSettingsNew} />}
                  mr={3}
                  onClick={handleSignOut}
                  isLoading={signOutResult.isLoading}
                >
                  Đăng Xuất
                </Button>
                <Button variant="ghost" onClick={signOutModal.onClose}>
                  Đóng
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
        <Box flex="1 1 auto" h="calc(100vh - 112px)">
          <Outlet />
        </Box>
      </Flex>
    </ScaleFade>
  );
}
